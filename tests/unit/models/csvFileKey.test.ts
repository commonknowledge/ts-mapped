import { v4 as uuidv4 } from "uuid";
import { describe, expect, test } from "vitest";
import { DataSourceType, csvConfigSchema } from "@/models/DataSource";
import { isCsvFileKeyUsableBy } from "@/utils/csvFileKey";

describe("csvConfigSchema", () => {
  const parse = (config: unknown) => csvConfigSchema.safeParse(config).success;

  test("accepts uploaded and sample file keys", () => {
    const key = `${uuidv4()}/${"a".repeat(32)}.csv`;
    expect(parse({ type: DataSourceType.CSV, fileKey: key })).toBe(true);
    expect(
      parse({ type: DataSourceType.CSV, fileKey: "sample/sampleMembers.csv" }),
    ).toBe(true);
    expect(
      parse({ type: DataSourceType.CSV, fileKey: "sample/ge2024.csv" }),
    ).toBe(true);
  });

  test.each([
    "file://.env",
    "file://resources/dataSets/sampleMembers.csv",
    "../.env",
    "sample/../../.env",
    "sample/sampleMembersXcsv",
    "https://example.com/members.csv",
    `${uuidv4()}/${"a".repeat(32)}.csv/../../.env`,
    "",
  ])("rejects the file key %s", (fileKey) => {
    expect(parse({ type: DataSourceType.CSV, fileKey })).toBe(false);
  });

  test("rejects the old URL config", () => {
    expect(parse({ type: DataSourceType.CSV, url: "file://../../.env" })).toBe(
      false,
    );
    expect(
      parse({ type: DataSourceType.CSV, url: "http://169.254.169.254/" }),
    ).toBe(false);
  });
});

describe("isCsvFileKeyUsableBy", () => {
  test("only the uploading organisation can use an uploaded file", () => {
    const organisationId = uuidv4();
    const fileKey = `${organisationId}/${"b".repeat(32)}.csv`;
    expect(isCsvFileKeyUsableBy({ fileKey, organisationId })).toBe(true);
    expect(isCsvFileKeyUsableBy({ fileKey, organisationId: uuidv4() })).toBe(
      false,
    );
  });

  test("any organisation can use a sample file", () => {
    expect(
      isCsvFileKeyUsableBy({
        fileKey: "sample/sampleMembers.csv",
        organisationId: uuidv4(),
      }),
    ).toBe(true);
  });
});
