import logger from "@/server/services/logger";
import { getErrorMessage } from "@/server/util";
import { DataSourceAdaptor, ExternalRecord } from "./abstract";

export class AirtableAdaptor implements DataSourceAdaptor {
  private apiKey: string;
  private baseId: string;
  private tableId: string;

  constructor(apiKey: string, baseId: string, tableId: string) {
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.tableId = tableId;
  }

  async getRecordCount() {
    return null;
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
      const error = getErrorMessage(e);
      logger.warn(
        `Could not get first record for Airtable ${this.baseId}: ${error}`,
      );
    }
    return null;
  }

  async fetchPage({ offset, limit }: { offset?: string; limit?: number }) {
    const url = new URL(
      `https://api.airtable.com/v0/${this.baseId}/${this.tableId}`,
    );
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
      throw Error(`Bad response: ${response.status}`);
    }

    const json = await response.json();
    if (typeof json !== "object") {
      throw Error(`Bad response body: ${response.json}`);
    }

    return json;
  }
}
