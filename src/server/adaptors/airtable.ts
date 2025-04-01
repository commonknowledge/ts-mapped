import { ColumnType } from "@/__generated__/types";
import { EnrichedRecord } from "@/server/mapping/enrich";
import logger from "@/server/services/logger";
import { batch } from "@/server/utils";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

export class AirtableAdaptor implements DataSourceAdaptor {
  private apiKey: string;
  private baseId: string;
  private tableId: string;
  private cachedFieldNames: string[] | null = null;

  constructor(apiKey: string, baseId: string, tableId: string) {
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.tableId = tableId;
  }

  async createField(name: string, type: ColumnType) {
    const url = new URL(
      `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${this.tableId}/fields`,
    );

    const body: Record<string, string | object> = {
      name,
      type: "singleLineText",
      description: "Mapped-managed field"
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
      const pageData = await this.fetchPage({ limit: 1 });
      const record = pageData.records[0];
      return {
        externalId: record.id,
        json: record.fields,
      };
    } catch (e) {
      logger.warn(
        `Could not get first record for Airtable ${this.baseId}: ${e}`,
      );
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
