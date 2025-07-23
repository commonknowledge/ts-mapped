import z from "zod";
import { ColumnType } from "@/__generated__/types";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { EnrichedRecord } from "@/server/mapping/enrich";
import {
  findAirtableWebhookById,
  upsertAirtableWebhook,
} from "@/server/repositories/AirtableWebhook";
import logger from "@/server/services/logger";
import { getPublicUrl } from "@/server/services/urls";
import { batch } from "@/server/utils";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

interface Webhook {
  id: string;
  specification: { options: unknown[] };
  notificationUrl: string;
  isHookEnabled: boolean;
  expirationTime: Date;
}

const WebhookNotification = z.object({
  base: z.object({
    id: z.string(),
  }),
  webhook: z.object({
    id: z.string(),
  }),
  timestamp: z.string(),
});

const WebhookPayload = z.object({
  changedTablesById: z.record(
    z.string(),
    z.object({
      changedRecordsById: z.record(z.string(), z.any()),
    }),
  ),
});

export class AirtableAdaptor implements DataSourceAdaptor {
  private dataSourceId: string;
  private apiKey: string;
  private baseId: string;
  private tableId: string;
  private cachedFieldNames: string[] | null = null;

  constructor(
    dataSourceId: string,
    apiKey: string,
    baseId: string,
    tableId: string,
  ) {
    this.dataSourceId = dataSourceId;
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.tableId = tableId;
  }

  async *extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string> {
    if (!body) {
      throw new Error("Empty Airtable webhook body");
    }

    logger.debug(`Airtable webhook body: ${JSON.stringify(body)}`);

    const notification = WebhookNotification.parse(body);
    if (notification.base.id !== this.baseId) {
      logger.error(
        `Mismatched Airtable webhook bases: URL ${this.apiKey}, Notification ${notification.base.id}`,
      );
    }

    const payloads = await this.fetchWebhookPayloads(notification.webhook.id);

    for (const payload of payloads) {
      logger.debug(`Airtable webhook payload: ${JSON.stringify(payload)}`);
      const parsedPayload = WebhookPayload.safeParse(payload);
      if (!parsedPayload.data) {
        logger.warn(`Unprocessed Airtable payload: ${JSON.stringify(payload)}`);
        continue;
      }
      const safePayload = parsedPayload.data;
      for (const changeDetails of Object.values(
        safePayload.changedTablesById,
      )) {
        for (const externalId of Object.keys(
          changeDetails.changedRecordsById,
        )) {
          yield externalId;
        }
      }
    }
  }

  async createField(name: string, type: ColumnType) {
    const url = new URL(
      `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${this.tableId}/fields`,
    );

    const body: {
      name: string;
      type: string;
      description: string;
      options?: {
        precision: number;
      };
    } = {
      name,
      type: "singleLineText",
      description: "Mapped-managed field",
    };

    switch (type) {
      case ColumnType.Number:
        body.type = "number";
        body.options = {
          precision: 8,
        };
        break;
      case ColumnType.Boolean:
        body.type = "checkbox";
        break;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad create field response: ${response.status}, ${responseText}`,
      );
    }

    this.cachedFieldNames?.push(name);
  }

  async fetchWebhookPayloads(webhookId: string): Promise<unknown[]> {
    let payloads: unknown[] = [];

    const dbWebhook = await findAirtableWebhookById(webhookId);
    let cursor = dbWebhook?.cursor || 1;
    let mightHaveMore = true;

    const payloadUrl = new URL(
      `https://api.airtable.com/v0/bases/${this.baseId}/webhooks/${webhookId}/payloads`,
    );

    while (mightHaveMore) {
      payloadUrl.searchParams.set("cursor", String(cursor));

      const response = await fetch(payloadUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad webhook payloads response: ${response.status}, ${responseText}`,
        );
      }

      const payloadData = await response.json();
      cursor = payloadData.cursor;
      mightHaveMore = payloadData.mightHaveMore;
      payloads = payloads.concat(payloadData.payloads);
    }

    await upsertAirtableWebhook({ id: webhookId, cursor });

    return payloads;
  }

  async getFields(): Promise<string[]> {
    if (this.cachedFieldNames) {
      return this.cachedFieldNames;
    }

    const url = new URL(
      `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`,
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad get fields response: ${response.status}, ${responseText}`,
      );
    }

    const json = await response.json();
    const table = json.tables.find(
      (table: { id: string }) => table.id === this.tableId,
    );
    if (!table) {
      return [];
    }

    const cachedFieldNames = table.fields.map(
      (field: { name: string }) => field.name,
    );
    this.cachedFieldNames = cachedFieldNames;

    return cachedFieldNames;
  }

  async getRecordCount() {
    return null;
  }

  getURL() {
    return new URL(
      `https://api.airtable.com/v0/${this.baseId}/${this.tableId}`,
    );
  }

  async *fetchAll(): AsyncGenerator<{
    externalId: string;
    json: Record<string, unknown>;
  }> {
    let offset: string | undefined;
    do {
      const pageData = await this.fetchPage({ offset });
      for (const record of pageData.records) {
        yield {
          externalId: record.id,
          json: record.fields,
        };
      }

      offset = pageData.offset;
    } while (offset);
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const pageData = await this.fetchPage({});
      for (const record of pageData.records) {
        // Return the first non-empty row
        if (Object.keys(record.fields).length > 0) {
          return {
            externalId: record.id,
            json: record.fields,
          };
        }
      }
    } catch (error) {
      logger.warn(`Could not get first record for Airtable ${this.baseId}`, {
        error,
      });
    }
    return null;
  }

  async fetchPage({ offset, limit }: { offset?: string; limit?: number }) {
    const url = this.getURL();
    if (offset) {
      url.searchParams.set("offset", offset);
    }
    if (limit) {
      url.searchParams.set("limit", String(limit));
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad fetch page response: ${response.status}, ${responseText}`,
      );
    }

    const json = await response.json();
    if (typeof json !== "object") {
      throw Error(`Bad fetch page response body: ${response.json}`);
    }

    return json;
  }

  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      // If this error happens it means jobs that fetch data by record ID
      // are too large and should be split into smaller batches
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const url = this.getURL();
    const formula = `OR(${externalIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    url.searchParams.set("filterByFormula", formula);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad fetch page response: ${response.status}, ${responseText}`,
      );
    }

    const json = await response.json();
    if (typeof json !== "object") {
      throw Error(`Bad fetch page response body: ${response.json}`);
    }

    return json.records.map(
      (r: { id: string; fields: Record<string, unknown> }) => ({
        externalId: r.id,
        json: r.fields,
      }),
    );
  }

  async listWebhooks(urlContains: string): Promise<Webhook[]> {
    const url = `https://api.airtable.com/v0/bases/${this.baseId}/webhooks`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(`Bad webhooks response: ${response.status}, ${responseText}`);
    }

    const json = await response.json();
    if (typeof json !== "object") {
      throw Error(`Bad webhooks response body: ${response.json}`);
    }

    return json.webhooks
      .filter((wh: Webhook) => wh.notificationUrl.includes(urlContains))
      .map((wh: Webhook) => ({
        ...wh,
        expirationTime: new Date(wh.expirationTime),
      }));
  }

  async removeDevWebhooks(): Promise<void> {
    const webhooks = await this.listWebhooks("ngrok");
    await this.removeWebhooks(webhooks);
  }

  async toggleWebhook(enable: boolean): Promise<void> {
    const publicUrl = await getPublicUrl();
    const webhooks = await this.listWebhooks(publicUrl);

    // Remove webhooks on user request
    if (!enable) {
      logger.info(
        `Removing Airtable webhooks for data source ${this.dataSourceId}`,
      );
      await this.removeWebhooks(webhooks);
      return;
    }

    // Skip recreating webhook that has at least 2 days of validity
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    if (
      webhooks.length === 1 &&
      webhooks[0].isHookEnabled &&
      webhooks[0].expirationTime > twoDaysFromNow
    ) {
      return;
    }

    // Cleanup expired webhooks
    await this.removeWebhooks(webhooks);

    const url = `https://api.airtable.com/v0/bases/${this.baseId}/webhooks`;
    const notificationUrl = await getPublicUrl(
      `/api/data-sources/${this.dataSourceId}/webhook`,
    );

    logger.info(
      `Airtable notification URL for data source ${this.dataSourceId}: ${notificationUrl}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        notificationUrl,
        specification: {
          options: {
            filters: {
              dataTypes: ["tableData"],
              recordChangeScope: this.tableId,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      if (responseText.includes("TOO_MANY_WEBHOOKS_IN_BASE")) {
        logger.error(
          `Airtable has too many webhooks. Try running ${"`"}npm run cmd -- removeDevWebhooks --id ${this.dataSourceId}${"`"}`,
        );
      }
      throw Error(`Bad webhooks response: ${response.status}, ${responseText}`);
    }
  }

  async removeWebhooks(webhooks: Webhook[]): Promise<void> {
    for (const webhook of webhooks) {
      logger.info(
        `Removing Airtable webhook for data source ${this.dataSourceId}: ${webhook.id}`,
      );
      const url = `https://api.airtable.com/v0/bases/${this.baseId}/webhooks/${webhook.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad webhooks response: ${response.status}, ${responseText}`,
        );
      }
    }
  }

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    const url = this.getURL();

    // Airtable update has a maximum record count of 10
    const batches = batch(enrichedRecords, 10);

    // Map used here to be able to remove the existing fields below
    const newFields = new Map<string, ColumnType>();
    for (const batch of batches) {
      for (const record of batch) {
        for (const column of record.columns) {
          newFields.set(column.def.name, column.def.type);
        }
      }
    }

    const existingFields = await this.getFields();
    for (const fieldName of existingFields) {
      newFields.delete(fieldName);
    }

    for (const [field, type] of newFields) {
      await this.createField(field, type);
    }

    for (const batch of batches) {
      const airtableRecords = batch.map((record) => {
        const fields: Record<string, unknown> = {};
        for (const column of record.columns) {
          fields[column.def.name] = column.value;
        }
        return {
          id: record.externalId,
          fields,
        };
      });

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-type": "application/json",
        },
        body: JSON.stringify({ records: airtableRecords }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad update records response: ${response.status}, ${responseText}`,
        );
      }
    }
  }
}
