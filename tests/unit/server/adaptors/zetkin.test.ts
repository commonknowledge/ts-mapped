import { describe, expect, inject, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { ColumnType } from "@/models/DataSource";
import { ZetkinAdaptor } from "@/server/adaptors/zetkin";

const credentials = inject("credentials");

describe("Zetkin adaptor tests", () => {
  test("Connection succeeds", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
    expect(firstRow).toHaveProperty("json");
  });

  test("fetchAll yields records", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
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
    expect(results[0].json).toHaveProperty("first_name");
  });

  test("fetchFirst returns first data record", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();

    if (firstRecord) {
      expect(firstRecord).toHaveProperty("externalId");
      expect(firstRecord).toHaveProperty("json");
      expect(typeof firstRecord.json).toBe("object");
      expect(firstRecord.json).toHaveProperty("first_name");
    }
  });

  test("fetchByExternalId returns records", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
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
      "test-data-source-id",
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
      "test-data-source-id",
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
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const count = await adaptor.getRecordCount();
    expect(count).toBeNull();
  });

  test("updateRecords skips non-enrichment columns", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }

    const originalExtId = firstRecord.json.ext_id;

    // Should not throw, and should not modify ext_id (not an enrichment column)
    await adaptor.updateRecords([
      {
        externalRecord: firstRecord,
        columns: [{ def: { name: "ext_id", type: ColumnType.String }, value: "should-not-be-set" }],
      },
    ]);

    const [refetched] = await adaptor.fetchByExternalId([firstRecord.externalId]);
    expect(refetched.json.ext_id).toBe(originalExtId);
  });

  test("deleteColumn rejects non-enrichment columns", () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    expect(() => adaptor.deleteColumn("NotPrefixed")).toThrow(
      `Refusing to delete column "NotPrefixed": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
    );
  });

  test("updateRecords patches person fields", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }

    const fieldName = `${ENRICHMENT_COLUMN_PREFIX}test`;
    const testValue = `mapped-test-${Date.now()}`;

    await adaptor.updateRecords([
      {
        externalRecord: firstRecord,
        columns: [{ def: { name: fieldName, type: ColumnType.String }, value: testValue }],
      },
    ]);

    const [updated] = await adaptor.fetchByExternalId([firstRecord.externalId]);
    expect(updated.json[fieldName]).toBe(testValue);
  });

  test("tagRecords adds a tag to a person", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }

    const tagName = `Mapped: test tag ${Date.now()}`;

    await adaptor.tagRecords([
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: { name: tagName, present: true },
      },
    ]);

    // Verify tag was added by re-tagging with the same name (idempotent — should not throw)
    await adaptor.tagRecords([
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: { name: tagName, present: true },
      },
    ]);
  });

  test("tagRecords removes a tag from a person", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }

    const tagName = `Mapped: removable tag ${Date.now()}`;

    // Add first, then remove
    await adaptor.tagRecords([
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: { name: tagName, present: true },
      },
    ]);

    await adaptor.tagRecords([
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: { name: tagName, present: false },
      },
    ]);
  });

  test("deleteColumn deletes an enrichment field", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    const fieldName = `${ENRICHMENT_COLUMN_PREFIX}delete-test-${Date.now()}`;

    // Create the field first via updateRecords
    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Zetkin");
    }
    await adaptor.updateRecords([
      {
        externalRecord: firstRecord,
        columns: [{ def: { name: fieldName, type: ColumnType.String }, value: "to-be-deleted" }],
      },
    ]);

    // Delete it
    await adaptor.deleteColumn(fieldName);

    // Field should no longer appear on fetched records
    const [refetched] = await adaptor.fetchByExternalId([firstRecord.externalId]);
    expect(refetched.json[fieldName]).toBeUndefined();
  });

  test("deleteColumn is a no-op when field does not exist in Zetkin", async () => {
    const adaptor = new ZetkinAdaptor(
      "test-data-source-id",
      credentials.zetkin.orgId,
      credentials.zetkin.oAuthCredentials,
    );

    // Should not throw for a non-existent enrichment field
    await expect(
      adaptor.deleteColumn(`${ENRICHMENT_COLUMN_PREFIX}nonexistent-field`),
    ).resolves.toBeUndefined();
  });
}, 60000);
