import { afterAll, describe, expect, inject, test } from "vitest";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { ColumnType } from "@/models/DataSource";
import { BaserowAdaptor } from "@/server/adaptors/baserow";
import { getPublicUrl } from "@/server/services/urls";

/**
 * These tests run against the real Baserow API, using the `baserow` entry in
 * test_credentials.json. The table it points at must contain:
 *
 * - a "Name" text field, with rows "Sleve McDichael" (id 1) and
 *   "Onson Sweemy" (id 2)
 * - an "Unused" field that is empty in every row
 * - a "Link" link-to-table field, pointing at a second table whose primary
 *   field holds "Matthew", "Mark", "Luke" and "John". "Sleve McDichael" links
 *   to Mark and Luke; "Onson Sweemy" links to John.
 * - a "Status" single select field, set to "Active" for "Sleve McDichael" and
 *   left unset for "Onson Sweemy"
 * - a "Tags" multiple select field, set to "Red" and "Blue" for
 *   "Sleve McDichael" and left empty for "Onson Sweemy"
 *
 * The tests create and delete their own "Mapped: ..." columns and webhooks.
 */
const credentials = inject("credentials");

const TAG_COLUMN = `${ENRICHMENT_COLUMN_PREFIX}Test Tag`;
const ENRICHMENT_COLUMN = `${ENRICHMENT_COLUMN_PREFIX}Test Column`;

const sorted = (value: unknown) =>
  Array.isArray(value) ? [...value].sort() : value;

const getAdaptor = () =>
  new BaserowAdaptor({
    dataSourceId: "test-data-source",
    apiUrl: credentials.baserow.apiUrl,
    tableId: credentials.baserow.tableId,
    email: credentials.baserow.email,
    password: credentials.baserow.password,
  });

describe("Baserow adaptor tests", () => {
  afterAll(async () => {
    // Columns and webhooks are created against a shared table, so leaving them
    // behind would change the result of the next run.
    const adaptor = getAdaptor();
    for (const column of [TAG_COLUMN, ENRICHMENT_COLUMN]) {
      try {
        await adaptor.deleteColumn(column);
      } catch {
        // best-effort cleanup
      }
    }
    try {
      await adaptor.toggleWebhook(false);
    } catch {
      // best-effort cleanup
    }
  });

  test("Connection succeeds", async () => {
    const adaptor = getAdaptor();
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
    // "Unused" is empty in every row, so it is only present if columns with no
    // values survive the import
    expect(firstRow?.json).toHaveProperty("Unused");
    expect(firstRow?.json["Name"]).toBe("Sleve McDichael");
  });

  test("fetchFirst strips Baserow row metadata", async () => {
    const adaptor = getAdaptor();
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow?.json).not.toHaveProperty("id");
    expect(firstRow?.json).not.toHaveProperty("order");
  });

  test("getFields returns fields", async () => {
    const adaptor = getAdaptor();
    const fields = await adaptor.getFields();
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.map((field) => field.name)).toContain("Name");
  });

  test("getRecordCount returns the number of rows", async () => {
    const adaptor = getAdaptor();
    const count = await adaptor.getRecordCount();
    expect(count).toBeGreaterThan(0);
  });

  test("fetchAll yields records", async () => {
    const adaptor = getAdaptor();
    const results = [];
    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
    }
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("externalId");
  });

  test("fetchPage returns page data", async () => {
    const adaptor = getAdaptor();
    const result = await adaptor.fetchPage({ page: 1 });
    expect(result).toHaveProperty("results");
    expect(result.count).toBeGreaterThan(0);
  });

  test("fetchByExternalId returns records", async () => {
    const adaptor = getAdaptor();
    const firstRow = await adaptor.fetchFirst();
    if (!firstRow) throw new Error("No records in table");
    const result = await adaptor.fetchByExternalId([firstRow.externalId]);
    expect(result[0]).toHaveProperty("externalId", firstRow.externalId);
  });

  // Link fields must come through as the linked rows' primary field values,
  // not as Baserow's `{ id, value }` objects
  test("resolves linked rows when fetching by external id", async () => {
    const adaptor = getAdaptor();
    // "Sleve McDichael", linked to two rows: Mark and Luke
    const records = await adaptor.fetchByExternalId(["1"]);
    expect(records).toHaveLength(1);
    // Sorted because the order depends on how the links were added in Baserow
    expect(sorted(records[0].json["Link"])).toEqual(["Luke", "Mark"]);
  });

  test("resolves linked rows when fetching all records", async () => {
    const adaptor = getAdaptor();
    const linksByName: Record<string, unknown> = {};
    for await (const record of adaptor.fetchAll()) {
      linksByName[String(record.json["Name"])] = sorted(record.json["Link"]);
    }
    expect(linksByName["Sleve McDichael"]).toEqual(["Luke", "Mark"]);
    expect(linksByName["Onson Sweemy"]).toEqual(["John"]);
  });

  // Select fields must come through as plain strings, as they do in Airtable,
  // rather than as Baserow's `{ id, value, color }` objects
  test("unwraps select fields", async () => {
    const adaptor = getAdaptor();
    const [record] = await adaptor.fetchByExternalId(["1"]);
    expect(record.json["Status"]).toBe("Active");
    expect(sorted(record.json["Tags"])).toEqual(["Blue", "Red"]);
  });

  test("leaves empty select fields empty", async () => {
    const adaptor = getAdaptor();
    const [record] = await adaptor.fetchByExternalId(["2"]);
    expect(record.json["Status"]).toBeNull();
    expect(record.json["Tags"]).toEqual([]);
  });

  test("fetchByExternalId skips deleted rows", async () => {
    const adaptor = getAdaptor();
    const result = await adaptor.fetchByExternalId(["999999999"]);
    expect(result).toEqual([]);
  });

  test("extractExternalRecordIdsFromWebhookBody yields created row IDs", async () => {
    const adaptor = getAdaptor();
    const body = {
      table_id: Number(credentials.baserow.tableId),
      event_type: "rows.created",
      items: [{ id: 123 }, { id: 456 }],
    };
    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }
    expect(ids).toEqual(["123", "456"]);
  });

  test("extractExternalRecordIdsFromWebhookBody yields deleted row IDs", async () => {
    const adaptor = getAdaptor();
    const body = {
      table_id: Number(credentials.baserow.tableId),
      event_type: "rows.deleted",
      row_ids: [789],
    };
    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }
    expect(ids).toEqual(["789"]);
  });

  test("extractExternalRecordIdsFromWebhookBody ignores other tables", async () => {
    const adaptor = getAdaptor();
    const body = {
      table_id: Number(credentials.baserow.tableId) + 1,
      event_type: "rows.created",
      items: [{ id: 123 }],
    };
    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }
    expect(ids).toEqual([]);
  });

  test("createField then deleteColumn round-trips", async () => {
    const adaptor = getAdaptor();
    try {
      await adaptor.createField(ENRICHMENT_COLUMN, ColumnType.Number);
    } catch (e) {
      expect(String(e)).toContain("ERROR_FIELD_WITH_SAME_NAME_ALREADY_EXISTS");
    }

    const fields = await adaptor.getFields();
    expect(fields.map((field) => field.name)).toContain(ENRICHMENT_COLUMN);

    await adaptor.deleteColumn(ENRICHMENT_COLUMN);

    // Use a fresh adaptor so the field list is not read from the cache
    const freshFields = await getAdaptor().getFields();
    expect(freshFields.map((field) => field.name)).not.toContain(
      ENRICHMENT_COLUMN,
    );
  });

  test("deleteColumn refuses non-enrichment columns", async () => {
    const adaptor = getAdaptor();
    await expect(adaptor.deleteColumn("Name")).rejects.toThrow(
      /Refusing to delete column/,
    );
  });

  test("tagRecords creates the column and writes the tag", async () => {
    const adaptor = getAdaptor();
    const firstRow = await adaptor.fetchFirst();
    if (!firstRow) throw new Error("No records in table");

    await adaptor.tagRecords([
      {
        externalId: firstRow.externalId,
        json: firstRow.json,
        tag: { name: TAG_COLUMN, present: true },
      },
    ]);

    const [tagged] = await adaptor.fetchByExternalId([firstRow.externalId]);
    expect(tagged.json[TAG_COLUMN]).toBe(true);

    await adaptor.tagRecords([
      {
        externalId: firstRow.externalId,
        json: firstRow.json,
        tag: { name: TAG_COLUMN, present: false },
      },
    ]);

    const [untagged] = await adaptor.fetchByExternalId([firstRow.externalId]);
    expect(untagged.json[TAG_COLUMN]).toBe(false);
  });

  test("webhooks", async () => {
    const adaptor = getAdaptor();

    // Start from a clean slate so the reported lifecycle is deterministic
    await adaptor.toggleWebhook(false);

    // Enabling with no existing webhook creates one and reports the new id
    const created = await adaptor.toggleWebhook(true);
    expect(created.action).toBe("created");
    expect(created.oldWebhookIds).toEqual([]);
    expect(created.newWebhookIds).toHaveLength(1);

    const webhooks = await adaptor.listWebhooks(await getPublicUrl());
    expect(webhooks).toHaveLength(1);
    expect(webhooks[0].active).toBe(true);

    // Enabling again keeps the existing, still-active webhook
    const kept = await adaptor.toggleWebhook(true);
    expect(kept.action).toBe("kept");
    expect(kept.newWebhookIds).toEqual(created.newWebhookIds);

    // Disabling removes it and reports what was removed
    const removed = await adaptor.toggleWebhook(false);
    expect(removed.action).toBe("removed");
    expect(removed.oldWebhookIds).toEqual(created.newWebhookIds);
    expect(removed.newWebhookIds).toEqual([]);

    expect(await adaptor.listWebhooks(await getPublicUrl())).toEqual([]);

    // Disabling when there is nothing to remove is a no-op
    const noop = await adaptor.toggleWebhook(false);
    expect(noop.action).toBe("noop");
  });
});
