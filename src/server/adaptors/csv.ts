import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";
import logger from "@/server/services/logger";
import { ExternalRecord } from "@/types";
import { DataSourceAdaptor } from "./abstract";

const getProjectFolder = () => {
  let currentDir = path.dirname(fileURLToPath(import.meta.url));
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw Error("Could not find project root directory");
    }
    currentDir = parentDir;
  }
  return currentDir;
};

export class CSVAdaptor implements DataSourceAdaptor {
  private idColumn: string;
  private filepath: string;

  constructor(idColumn: string, filename: string) {
    this.idColumn = idColumn;
    this.filepath = path.join(
      getProjectFolder(),
      "resources",
      "dataSets",
      filename,
    );
  }

  extractExternalRecordIdsFromWebhookBody(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body: unknown,
  ): AsyncGenerator<string> {
    throw new Error("Method not implemented.");
  }

  async getRecordCount() {
    const fileStream = fs.createReadStream(this.filepath);
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

  async *fetchAll(): AsyncGenerator<ExternalRecord> {
    const content = fs.createReadStream(this.filepath);
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
      const content = fs.createReadStream(this.filepath);
      const parser = content.pipe(parse({ columns: true }));
      for await (const record of parser) {
        if (this.idColumn in record) {
          return { externalId: record[this.idColumn], json: record };
        }
        throw new Error(`ID column "${this.idColumn}" missing`);
      }
    } catch (error) {
      logger.warn(`Could not get first record for CSV ${this.filepath}`, {
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
