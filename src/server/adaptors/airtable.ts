import { DataSourceAdaptor } from "./abstract";

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
      const url = new URL(
        `https://api.airtable.com/v0/${this.baseId}/${this.tableId}`,
      );
      if (offset) {
        url.searchParams.set("offset", offset);
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

      const records = json.records;
      for (const record of records) {
        let json = record._rawJson;
        if (typeof json !== "object") {
          json = { value: json };
        }
        yield {
          externalId: record.id,
          json: record.fields,
        };
      }

      offset = json.offset;
    } while (offset);
  }
}
