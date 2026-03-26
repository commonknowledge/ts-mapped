import { describe, expect, inject, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { ZetkinAdaptor } from "@/server/adaptors/zetkin";

const credentials = inject("credentials");

describe("Zetkin adaptor tests", () => {
  test.only("Connection succeeds", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
    expect(firstRow).toHaveProperty("json");
  });

  test("fetchAll yields records", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const results = [];
    let count = 0;
    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
      count++;
      if (count >= 5) break;
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("externalId");
    expect(results[0]).toHaveProperty("json");
    expect(results[0].json).toHaveProperty("name");
  });

  test("fetchFirst returns first data record", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();

    if (firstRecord) {
      expect(firstRecord).toHaveProperty("externalId");
      expect(firstRecord).toHaveProperty("json");
      expect(typeof firstRecord.json).toBe("object");
      expect(firstRecord.json).toHaveProperty("name");
    }
  });

  test("fetchByExternalId returns records", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }

    const result = await adaptor.fetchByExternalId([firstRecord.externalId]);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("externalId", firstRecord.externalId);
    expect(result[0]).toHaveProperty("json");
  });

  test("fetchByExternalId handles multiple IDs", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const records = [];
    let count = 0;
    for await (const rec of adaptor.fetchAll()) {
      records.push(rec);
      count++;
      if (count >= 3) break;
    }

    if (records.length < 2) {
      throw new Error("Need at least 2 records for this test");
    }

    const externalIds = records.slice(0, 2).map((r) => r.externalId);
    const result = await adaptor.fetchByExternalId(externalIds);
    expect(result.length).toBe(2);
    expect(result.map((r) => r.externalId)).toEqual(
      expect.arrayContaining(externalIds),
    );
  });

  test("fetchByExternalId respects batch size limit", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const tooManyIds = Array.from({ length: 101 }, (_, i) => `id-${i}`);

    await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
      "Cannot fetch more than 100 records at once.",
    );
  });

  test("getRecordCount returns null", async () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const count = await adaptor.getRecordCount();
    expect(count).toBeNull();
  });

  test("deleteColumn rejects non-enrichment columns", () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    expect(() => adaptor.deleteColumn("NotPrefixed")).toThrow(
      `Refusing to delete column "NotPrefixed": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
    );
  });

  test("deleteColumn throws not supported error", () => {
    const adaptor = new ZetkinAdaptor(
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    expect(() => adaptor.deleteColumn("Mapped: AnyField")).toThrow(
      "Zetkin does not support deleting fields.",
    );
  });
}, 60000);
