import crypto from "crypto";
import z from "zod";
import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import logger from "@/server/services/logger";
import { getPublicUrl } from "@/server/services/urls";
import { batch } from "@/server/utils";
import type { DataSourceAdaptor } from "./abstract";
import type { EnrichedRecord } from "@/server/mapping/enrich";
import type { ExternalRecord, TaggedRecord } from "@/types";

interface MergeField {
  merge_id: number;
  tag: string;
  name: string;
  type: string;
  required: boolean;
  default_value: string;
  public: boolean;
  display_order: number;
  options?: {
    default_country?: number;
    phone_format?: string;
    date_format?: string;
    choices?: string[];
    size?: number;
  };
  help_text: string;
  list_id: string;
}

interface Webhook {
  id: string;
  url: string;
  events: {
    subscribe: boolean;
    unsubscribe: boolean;
    profile: boolean;
    cleaned: boolean;
    upemail: boolean;
    campaign: boolean;
  };
  sources: {
    user: boolean;
    admin: boolean;
    api: boolean;
  };
}

const WebhookNotification = z.object({
  type: z.string(),
  fired_at: z.string(),
  "data[id]": z.string(),
  "data[email]": z.string(),
  "data[list_id]": z.string(),
});

export class MailchimpAdaptor implements DataSourceAdaptor {
  private dataSourceId: string;
  private apiKey: string;
  private listId: string;
  private serverPrefix: string;
  private cachedMergeFields: MergeField[] | null = null;

  constructor(dataSourceId: string, apiKey: string, listId: string) {
    this.dataSourceId = dataSourceId;
    this.apiKey = apiKey;
    this.listId = listId;
    // Extract server prefix from API key (e.g., "us1" from "abc123-us1")
    this.serverPrefix = apiKey.split("-")[1] || "us1";
  }

  async *extractExternalRecordIdsFromWebhookBody(
    body: unknown,
  ): AsyncGenerator<string> {
    if (!body) {
      throw new Error("Empty Mailchimp webhook body");
    }

    logger.debug(`Mailchimp webhook body: ${JSON.stringify(body)}`);

    const notification = WebhookNotification.parse(body);

    // Only process events for our specific list
    if (notification["data[list_id]"] !== this.listId) {
      logger.error(
        `Mismatched Mailchimp webhook list: Expected ${this.listId}, got ${notification["data[list_id]"]}`,
      );
      return;
    }

    yield this.getEmailHash(notification["data[email]"]);
  }

  private getEmailHash(email: string): string {
    // Mailchimp uses MD5 hash of lowercase email as member ID
    return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
  }

  private getBaseUrl(): string {
    return `https://${this.serverPrefix}.api.mailchimp.com/3.0`;
  }

  private getListUrl(): string {
    return `${this.getBaseUrl()}/lists/${this.listId}`;
  }

  private getHeaders() {
    return {
      Authorization: `apikey ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async getRecordCount(): Promise<number | null> {
    try {
      const response = await fetch(`${this.getListUrl()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad get list response: ${response.status}, ${responseText}`,
        );
      }

      const json = (await response.json()) as {
        stats?: { member_count?: number };
      };
      return json.stats?.member_count || null;
    } catch (error) {
      logger.warn(
        `Could not get record count for Mailchimp list ${this.listId}`,
        {
          error,
        },
      );
      return null;
    }
  }

  async getMergeFields(): Promise<MergeField[]> {
    if (this.cachedMergeFields) {
      return this.cachedMergeFields;
    }

    const url = `${this.getListUrl()}/merge-fields`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad get merge fields response: ${response.status}, ${responseText}`,
      );
    }

    const json = (await response.json()) as { merge_fields: MergeField[] };
    this.cachedMergeFields = json.merge_fields || [];
    return json.merge_fields || [];
  }

  private flattenAddress(
    addressData: Record<string, string>,
  ): Record<string, unknown> {
    if (!addressData || typeof addressData !== "object") {
      return {};
    }

    return {
      address_addr1: addressData.addr1 || "",
      address_addr2: addressData.addr2 || "",
      address_city: addressData.city || "",
      address_state: addressData.state || "",
      address_zip: addressData.zip || "",
      address_country: addressData.country || "",
    };
  }

  private transformMemberData(
    member: Record<string, unknown>,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {
      email_address: member.email_address,
      status: member.status,
      timestamp_signup: member.timestamp_signup,
      timestamp_opt: member.timestamp_opt,
      last_changed: member.last_changed,
      language: member.language,
      vip: member.vip,
      email_client: member.email_client,
      source: member.source,
      tags_count: member.tags_count,
      list_id: member.list_id,
    };

    // Add merge field data
    if (member.merge_fields) {
      for (const [key, value] of Object.entries(member.merge_fields)) {
        if (key === "ADDRESS" && value && typeof value === "object") {
          // Flatten ADDRESS merge field
          Object.assign(data, this.flattenAddress(value));
        } else {
          data[key] = value;
        }
      }
    }

    // Add tags as a comma-separated string
    if (member.tags && Array.isArray(member.tags)) {
      for (const tag of member.tags as { name: string }[]) {
        data[tag.name] = true;
      }
    }

    return data;
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    let offset = 0;
    const count = 1000; // Mailchimp's maximum

    do {
      const url = `${this.getListUrl()}/members?offset=${offset}&count=${count}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad fetch members response: ${response.status}, ${responseText}`,
        );
      }

      const json = (await response.json()) as { members: { id: string }[] };
      const members = json.members || [];

      for (const member of members) {
        yield {
          externalId: member.id,
          json: this.transformMemberData(member),
        };
      }

      // Check if we have more records
      if (members.length < count) {
        break;
      }
      offset += count;
    } while (true);
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const url = `${this.getListUrl()}/members?count=1`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad fetch first member response: ${response.status}, ${responseText}`,
        );
      }

      const json = (await response.json()) as { members: { id: string }[] };
      const members = json.members || [];

      if (members.length > 0) {
        const member = members[0];
        return {
          externalId: member.id,
          json: this.transformMemberData(member),
        };
      }
    } catch (error) {
      logger.warn(
        `Could not get first record for Mailchimp list ${this.listId}`,
        {
          error,
        },
      );
    }
    return null;
  }

  async fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    if (externalIds.length > DATA_RECORDS_JOB_BATCH_SIZE) {
      throw new Error("Cannot fetch more than 100 records at once.");
    }

    const records: ExternalRecord[] = [];

    // Mailchimp doesn't support batch fetching by ID, so we fetch individually
    for (const externalId of externalIds) {
      try {
        const url = `${this.getListUrl()}/members/${externalId}`;
        const response = await fetch(url, {
          headers: this.getHeaders(),
        });

        if (response.ok) {
          const member = (await response.json()) as { id: string };
          records.push({
            externalId: member.id,
            json: this.transformMemberData(member),
          });
        } else if (response.status === 404) {
          // Member not found, skip
          logger.debug(`Mailchimp member not found: ${externalId}`);
        } else {
          const responseText = await response.text();
          logger.warn(
            `Error fetching Mailchimp member ${externalId}: ${response.status}, ${responseText}`,
          );
        }
      } catch (error) {
        logger.warn(`Error fetching Mailchimp member ${externalId}`, { error });
      }
    }

    return records;
  }

  async listWebhooks(urlContains: string): Promise<Webhook[]> {
    const url = `${this.getListUrl()}/webhooks`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad list webhooks response: ${response.status}, ${responseText}`,
      );
    }

    const json = (await response.json()) as { webhooks: Webhook[] };
    const webhooks = json.webhooks || [];

    return webhooks.filter((webhook: Webhook) =>
      webhook.url.includes(urlContains),
    );
  }

  async tagRecords(records: TaggedRecord[]): Promise<void> {
    // Mailchimp allows batch operations with up to 500 operations
    const batches = batch(records, 500);

    for (const recordBatch of batches) {
      const operations = recordBatch.map((record) => {
        return {
          method: "POST",
          path: `/lists/${this.listId}/members/${record.externalId}/tags`,
          body: JSON.stringify({
            tags: [
              {
                name: record.tag.name,
                status: record.tag.present ? "active" : "inactive",
              },
            ],
          }),
        };
      });

      const batchUrl = `${this.getBaseUrl()}/batches`;
      const response = await fetch(batchUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          operations,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad batch tag response: ${response.status}, ${responseText}`,
        );
      }

      const batchResponse = (await response.json()) as { id: string };
      logger.info(
        `Submitted Mailchimp batch tag operation for data source ${this.dataSourceId}: ${batchResponse.id}`,
      );

      // Note: Mailchimp batch operations are asynchronous
      // You might want to implement polling to check batch status
      // For now, we'll just log the batch ID
    }
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
        `Removing Mailchimp webhooks for data source ${this.dataSourceId}`,
      );
      await this.removeWebhooks(webhooks);
      return;
    }

    // If we already have a webhook, don't create another
    if (webhooks.length > 0) {
      logger.info(
        `Mailchimp webhook already exists for data source ${this.dataSourceId}`,
      );
      return;
    }

    const url = `${this.getListUrl()}/webhooks`;
    const notificationUrl = await getPublicUrl(
      `/api/data-sources/${this.dataSourceId}/webhook`,
    );

    logger.info(
      `Mailchimp notification URL for data source ${this.dataSourceId}: ${notificationUrl}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        url: notificationUrl,
        events: {
          subscribe: true,
          unsubscribe: false,
          profile: true,
          cleaned: true,
          upemail: true,
          campaign: false,
        },
        sources: {
          user: true,
          admin: true,
          api: false, // Avoid infinite loop
        },
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw Error(
        `Bad create webhook response: ${response.status}, ${responseText}`,
      );
    }

    const webhook = (await response.json()) as { id: string };
    logger.info(
      `Created Mailchimp webhook for data source ${this.dataSourceId}: ${webhook.id}`,
    );
  }

  async removeWebhooks(webhooks: Webhook[]): Promise<void> {
    for (const webhook of webhooks) {
      logger.info(
        `Removing Mailchimp webhook for data source ${this.dataSourceId}: ${webhook.id}`,
      );
      const url = `${this.getListUrl()}/webhooks/${webhook.id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad delete webhook response: ${response.status}, ${responseText}`,
        );
      }
    }
  }

  async updateRecords(enrichedRecords: EnrichedRecord[]): Promise<void> {
    // Mailchimp allows batch operations with up to 500 operations
    const batches = batch(enrichedRecords, 500);

    for (const recordBatch of batches) {
      const operations = recordBatch.map((record) => {
        const mergeFields: Record<string, unknown> = {};

        for (const column of record.columns) {
          const fieldName = column.def.name;

          // Handle ADDRESS fields specially - reconstruct the address object
          if (fieldName.startsWith("address_")) {
            // We'll handle address fields in a separate pass
            continue;
          }

          mergeFields[fieldName] = column.value;
        }

        // Reconstruct ADDRESS merge field if we have address components
        const addressFields = record.columns.filter((col) =>
          col.def.name.startsWith("address_"),
        );

        if (addressFields.length > 0) {
          const address: Record<string, unknown> = {};
          for (const addressField of addressFields) {
            const addressKey = addressField.def.name.replace("address_", "");
            address[addressKey] = addressField.value;
          }
          if (Object.keys(address).length > 0) {
            mergeFields["ADDRESS"] = address;
          }
        }

        return {
          method: "PATCH",
          path: `/lists/${this.listId}/members/${record.externalRecord.externalId}`,
          params: {
            skip_merge_validation: true,
          },
          body: JSON.stringify({
            merge_fields: mergeFields,
          }),
        };
      });

      const batchUrl = `${this.getBaseUrl()}/batches`;
      const response = await fetch(batchUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          operations,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw Error(
          `Bad batch update response: ${response.status}, ${responseText}`,
        );
      }

      const batchResponse = (await response.json()) as { id: string };
      logger.info(
        `Submitted Mailchimp batch update for data source ${this.dataSourceId}: ${batchResponse.id}`,
      );

      // Note: Mailchimp batch operations are asynchronous
      // You might want to implement polling to check batch status
      // For now, we'll just log the batch ID
    }
  }
}
