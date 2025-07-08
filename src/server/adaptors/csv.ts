import readline from "readline";
import { Readable } from "stream";
import { parse } from "csv-parse";
import logger from "@/server/services/logger";
import { getLocalUrl } from "@/server/services/urls";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

export class CSVAdaptor implements DataSourceAdaptor {
  private idColumn: string;
  private url: string;

  constructor(idColumn: string, url: string) {
    this.idColumn = idColumn;
    this.url = url.startsWith("/api/upload") ? getLocalUrl(url) : url;
  }

  extractExternalRecordIdsFromWebhookBody(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body: unknown,
  ): AsyncGenerator<string> {
    throw new Error("Method not implemented.");
  }

  async getRecordCount() {
    const fileStream = await this.createReadStream();
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of rl) {
      lineCount++;
    }

    return Math.max(lineCount - 1, 0); // exclude header row
  }

  async createReadStream() {
    const response = await fetch(this.url);
    if (!response.body) {
      throw new Error(`Could not read URL ${this.url}`);
    }
    return Readable.from(response.body);
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    const content = await this.createReadStream();
    const parser = content.pipe(parse({ columns: true }));
    // Parse the CSV content
    for await (const record of parser) {
      if (this.idColumn in record) {
        yield { externalId: record[this.idColumn], json: record };
      }
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const content = await this.createReadStream();
      const parser = content.pipe(parse({ columns: true }));
      for await (const record of parser) {
        if (this.idColumn in record) {
          return { externalId: record[this.idColumn], json: record };
        }
        throw new Error(`ID column "${this.idColumn}" missing`);
      }
    } catch (error) {
      logger.warn(`Could not get first record for CSV ${this.url}`, {
        error,
      });
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetchByExternalId(externalIds: string[]): Promise<ExternalRecord[]> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeDevWebhooks(dataSourceId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async toggleWebhook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dataSourceId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enable: boolean,
  ): Promise<void> {
    throw new Error("Unimplemented");
  }

  updateRecords(): Promise<void> {
    throw new Error("CSVs are not updatable.");
  }
}
