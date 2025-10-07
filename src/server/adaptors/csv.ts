import * as fs from "fs";
import { join } from "path";
import readline from "readline";
import { Readable } from "stream";
import { parse } from "csv-parse";
import logger from "@/server/services/logger";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { getBaseDir } from "../utils";
import type { DataSourceAdaptor } from "./abstract";
import type { ExternalRecord } from "@/types";

export class CSVAdaptor implements DataSourceAdaptor {
  private url: string;

  constructor(url: string) {
    this.url = url.startsWith("/api/upload") ? getAbsoluteUrl(url) : url;
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
    if (this.url.startsWith("file://")) {
      return this.createFileReadStream(this.url);
    }
    const response = await fetch(this.url);
    if (!response.body) {
      throw new Error(`Could not read URL ${this.url}`);
    }
    return Readable.from(response.body);
  }

  createFileReadStream(url: string) {
    const relativePath = url.replace(/^file:\/\//, "").split("?")[0];
    const absolutePath = join(getBaseDir(), relativePath);
    return fs.createReadStream(absolutePath);
  }

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    const content = await this.createReadStream();
    const parser = content.pipe(parse({ columns: true }));
    // Parse the CSV content
    let row = 1;
    for await (const record of parser) {
      if (Object.keys(record).length) {
        yield { externalId: String(row), json: record };
        row++;
      }
    }
  }

  async fetchFirst(): Promise<ExternalRecord | null> {
    try {
      const content = await this.createReadStream();
      const parser = content.pipe(parse({ columns: true }));
      for await (const record of parser) {
        if (Object.keys(record).length) {
          return { externalId: "1", json: record };
        }
      }
      throw new Error("Empty CSV");
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

  removeDevWebhooks(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async toggleWebhook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enable: boolean,
  ): Promise<void> {
    throw new Error("Unimplemented");
  }

  updateRecords(): Promise<void> {
    throw new Error("CSVs are not updatable.");
  }

  tagRecords(): Promise<void> {
    throw new Error("CSVs are not updatable.");
  }
}
