import { expect, inject, test } from "vitest";
import { vi } from "vitest";
import { ColumnType } from "@/__generated__/types";
import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { getPublicUrl } from "@/server/services/urls";

const credentials = inject("credentials");

test("Connection succeeds", async () => {
  const adaptor = new AirtableAdaptor(
    "test-data-source",
    credentials.airtable.apiKey,
    credentials.airtable.baseId,
    credentials.airtable.tableId,
  );
  const firstRow = await adaptor.fetchFirst();
  expect(firstRow).toHaveProperty("externalId");
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
  await adaptor.toggleWebhook(true);

  let result = await adaptor.listWebhooks(await getPublicUrl());
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);

  await adaptor.toggleWebhook(false);

  result = await adaptor.listWebhooks(await getPublicUrl());
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(0);
});

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
      externalId: all[0].externalId,
      columns: [
        {
          def: { name: "Mapped: Test Field", type: ColumnType.String },
          value: newValue,
        },
      ],
    },
  ];
  await adaptor.updateRecords(enrichedRecords);

  const newRec = await adaptor.fetchByExternalId([all[0].externalId]);
  expect(newRec[0].json["Mapped: Test Field"]).toBe(newValue);
});
