import * as fs from "fs";
import { join } from "path";
import { Readable } from "stream";
import { parse } from "csv-parse";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
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
    const stream = await this.createReadStream();
    stream.setEncoding("utf8");

    let lineCount = 0;
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      lineCount += lines.length;
    }

    if (buffer.trim().length > 0) {
      lineCount += 1;
    }

    // exclude header row
    return Math.max(lineCount - 1, 0);
  }

  async createReadStream() {
    if (this.url.startsWith("file://")) {
      return this.createFileReadStream(this.url);
    }
    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error(
        `Could not fetch CSV URL ${this.url} (HTTP ${response.status})`,
      );
    }
    if (!response.body) {
      throw new Error(`Could not read URL ${this.url}`);
    }

    // Buffer the entire response to avoid Render's proxy killing
    // long-lived HTTP connections during slow stream consumption
    const buffer = Buffer.from(await response.arrayBuffer());
    return Readable.from(buffer);
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

  deleteColumn(columnName: string): Promise<void> {
    if (!columnName.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
      throw new Error(
        `Refusing to delete column "${columnName}": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
      );
    }
    throw new Error("CSVs are not updatable.");
  }
}
