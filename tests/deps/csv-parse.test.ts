import { Readable } from "stream";
import { parse } from "csv-parse";
import { describe, expect, test } from "vitest";

/**
 * csv-parse as used in src/server/adaptors/csv.ts: pipe a stream into
 * parse({ columns: true }) and iterate records with for-await.
 */
describe("csv-parse", () => {
  test("streams rows as objects keyed by header", async () => {
    const content = Readable.from(['name,age\n"Smith, J",42\nAda,36\n']);
    const parser = content.pipe(parse({ columns: true }));
    const rows: Record<string, string>[] = [];
    for await (const record of parser) {
      rows.push(record);
    }
    expect(rows).toEqual([
      { name: "Smith, J", age: "42" },
      { name: "Ada", age: "36" },
    ]);
  });
});
