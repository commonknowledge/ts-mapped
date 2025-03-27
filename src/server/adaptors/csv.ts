import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";
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
  async *fetchAll(): AsyncGenerator<{
    externalId: string;
    json: Record<string, unknown>;
  }> {
    const content = fs.createReadStream(this.filepath);
    const parser = content.pipe(parse({ columns: true }));
    // Parse the CSV content
    for await (const record of parser) {
      yield { externalId: record[this.idColumn], json: record };
    }
  }
}
