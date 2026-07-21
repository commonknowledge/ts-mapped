import { describe, expect, inject, test } from "vitest";
import { vi } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { ColumnType } from "@/models/DataSource";
import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { getPublicUrl } from "@/server/services/urls";

const credentials = inject("credentials");

describe("Airtable adaptor tests", () => {
  test("Connection succeeds", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
    expect(firstRow?.json).toHaveProperty("Empty Field");
    expect(firstRow?.json["Constant Field"]).toBe("Hello");
  });

  test("extractExternalRecordIdsFromWebhookBody yields external IDs", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    // Use Vitest's vi.stubGlobal to mock fetch with two responses
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            cursor: 2,
            mightHaveMore: true,
            payloads: [
              {
                changedTablesById: {
                  [credentials.airtable.tableId]: {
                    changedRecordsById: { rec123: {} },
                  },
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            cursor: 3,
            mightHaveMore: false,
            payloads: [
              {
                changedTablesById: {
                  [credentials.airtable.tableId]: {
                    changedRecordsById: { rec456: {} },
                  },
                },
              },
            ],
          }),
        }),
    );
    const body = {
      base: { id: credentials.airtable.baseId },
      webhook: { id: "mock_webhook_id" },
      timestamp: new Date().toISOString(),
    };
    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }
    expect(ids).toContain("rec123");
    expect(ids).toContain("rec456");
    vi.unstubAllGlobals();
  });

  // The test base's "Table 1" has a "Link" field pointing at "Linked
  // Table"; linked record ids must come through as the linked records'
  // primary field values ("Name")
  test("resolves linked record ids when fetching by external id", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    // "Paul", linked to two records: Mark and Luke
    const records = await adaptor.fetchByExternalId(["reckBm7wJxGA5R0bV"]);
    expect(records).toHaveLength(1);
    expect(records[0].json["Link"]).toEqual(["Mark", "Luke"]);
  });

  test("resolves linked record ids when fetching all records", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const linksByName: Record<string, unknown> = {};
    for await (const record of adaptor.fetchAll()) {
      linksByName[String(record.json["Name"])] = record.json["Link"];
    }
    expect(linksByName["Ringo"]).toEqual(["John"]);
    expect(linksByName["George"]).toEqual(["John"]);
    expect(linksByName["John"]).toEqual(["Matthew"]);
    expect(linksByName["Paul"]).toEqual(["Mark", "Luke"]);
  });

  test("createField creates a field", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    try {
      await adaptor.createField("TestField", ColumnType.String);
    } catch (e) {
      expect(String(e)).toContain("DUPLICATE");
    }
    const fields = await adaptor.getFields();
    expect(fields).toContain("TestField");
  });

  test("getFields returns field names", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const fields = await adaptor.getFields();
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);
  });

  test("getRecordCount returns null", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const count = await adaptor.getRecordCount();
    expect(count).toBeNull();
  });

  test("getURL returns correct URL", () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const url = adaptor.getURL();
    expect(url.toString()).toContain(adaptor["baseId"]);
    expect(url.toString()).toContain(adaptor["tableId"]);
  });

  test("fetchAll yields records", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const results = [];
    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
    }
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("externalId");
  });

  test("fetchPage returns page data", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const result = await adaptor.fetchPage({});
    expect(result).toHaveProperty("records");
  });

  test("fetchByExternalId returns records", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const all = [];
    for await (const rec of adaptor.fetchAll()) {
      all.push(rec);
    }
    if (all.length === 0) throw new Error("No records in table");
    const result = await adaptor.fetchByExternalId([all[0].externalId]);
    expect(result[0]).toHaveProperty("externalId", all[0].externalId);
  });

  test("webhooks", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );

    // Start from a clean slate so the reported lifecycle is deterministic
    await adaptor.toggleWebhook(false);

    // Enabling with no existing webhook creates one and reports the new id
    const created = await adaptor.toggleWebhook(true);
    expect(created.action).toBe("created");
    expect(created.oldWebhookIds).toEqual([]);
    expect(created.newWebhookIds).toHaveLength(1);

    let result = await adaptor.listWebhooks(await getPublicUrl());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Enabling again keeps the freshly-created webhook (well over 2 days valid)
    const kept = await adaptor.toggleWebhook(true);
    expect(kept.action).toBe("kept");
    expect(kept.newWebhookIds).toEqual(created.newWebhookIds);

    // Disabling removes it and reports the removed id as an old id
    const removed = await adaptor.toggleWebhook(false);
    expect(removed.action).toBe("removed");
    expect(removed.oldWebhookIds).toEqual(created.newWebhookIds);
    expect(removed.newWebhookIds).toEqual([]);

    result = await adaptor.listWebhooks(await getPublicUrl());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);

    // Disabling again when nothing is left is a no-op, not a removal
    const noop = await adaptor.toggleWebhook(false);
    expect(noop.action).toBe("noop");
    expect(noop.oldWebhookIds).toEqual([]);
    expect(noop.newWebhookIds).toEqual([]);
  }, 30000);

  test("updateRecords updates a record", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );
    const all = [];
    for await (const rec of adaptor.fetchAll()) {
      all.push(rec);
    }

    if (all.length === 0) {
      throw new Error("No records in table");
    }

    const newValue = "test-value-" + Date.now(); // Unique value to verify update
    const enrichedRecords = [
      {
        externalRecord: all[0],
        columns: [
          {
            def: {
              name: "Mapped: Test Field",
              type: ColumnType.String,
            },
            value: newValue,
          },
        ],
      },
    ];
    await adaptor.updateRecords(enrichedRecords);

    const newRec = await adaptor.fetchByExternalId([all[0].externalId]);
    expect(newRec[0].json["Mapped: Test Field"]).toBe(newValue);
  });

  test("tagRecords updates a record", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );

    // Get a record first
    const firstRecord = await adaptor.fetchFirst();
    if (!firstRecord) {
      throw new Error("No records found in Airtable");
    }

    const taggedRecords = [
      {
        externalId: firstRecord.externalId,
        json: firstRecord.json,
        tag: {
          name: "My View",
          present: true,
        },
      },
    ];

    await adaptor.tagRecords(taggedRecords);

    let updatedRecords = await adaptor.fetchByExternalId([
      firstRecord.externalId,
    ]);

    expect(updatedRecords[0].json["My View"]).toBe(true);

    taggedRecords[0].tag.present = false;
    await adaptor.tagRecords(taggedRecords);
    updatedRecords = await adaptor.fetchByExternalId([firstRecord.externalId]);

    expect(updatedRecords[0].json["My View"]).toBeFalsy();
  });

  test("deleteColumn throws not supported error", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );

    expect(() => adaptor.deleteColumn("Mapped: AnyField")).toThrow(
      "Airtable does not support deleting fields.",
    );
  });

  test("deleteColumn rejects non-enrichment columns", async () => {
    const adaptor = new AirtableAdaptor(
      "test-data-source",
      credentials.airtable.apiKey,
      credentials.airtable.baseId,
      credentials.airtable.tableId,
    );

    expect(() => adaptor.deleteColumn("NotPrefixed")).toThrow(
      `Refusing to delete column "NotPrefixed": only enrichment columns (prefixed with "${ENRICHMENT_COLUMN_PREFIX}") can be deleted.`,
    );
  });
}, 10000);
