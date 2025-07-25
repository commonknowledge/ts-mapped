import { expect, inject, test } from "vitest";
import { ColumnType } from "@/__generated__/types";
import { ActionNetworkAdaptor } from "@/server/adaptors/actionnetwork";

const credentials = inject("credentials");

test("Connection succeeds", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);
  const firstRow = await adaptor.fetchFirst();
  expect(firstRow).toHaveProperty("externalId");
});

test("extractExternalRecordIdsFromWebhookBody yields external IDs", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Mock Action Network webhook payload structure
  const body = [
    {
      identifiers: ["test-id-1"],
      given_name: "John",
      family_name: "Doe",
      email_addresses: [{ address: "john@example.com", primary: true }],
      _links: {
        self: { href: "https://actionnetwork.org/api/v2/people/rec123" },
      },
    },
    {
      identifiers: ["test-id-2"],
      given_name: "Jane",
      family_name: "Smith",
      email_addresses: [{ address: "jane@example.com", primary: true }],
      _links: {
        self: { href: "https://actionnetwork.org/api/v2/people/rec456" },
      },
    },
  ];

  const ids = [];
  for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
    body,
  )) {
    ids.push(id);
  }
  expect(ids).toContain("rec123");
  expect(ids).toContain("rec456");
});

test("fetchAll yields records", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);
  const results = [];
  let count = 0;
  for await (const rec of adaptor.fetchAll()) {
    results.push(rec);
    count++;
    // Limit to first 5 records to avoid long test times
    if (count >= 5) break;
  }
  expect(results.length).toBeGreaterThan(0);
  expect(results[0]).toHaveProperty("externalId");
  expect(results[0]).toHaveProperty("json");
});

test("fetchPage returns page data", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);
  const result = await adaptor.fetchPage({ page: 1, limit: 5 });
  expect(result).toHaveProperty("_embedded");
  expect(result._embedded).toHaveProperty("osdi:people");
});

test("fetchByExternalId returns records", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Get a record first
  const firstRecord = await adaptor.fetchFirst();
  if (!firstRecord) {
    throw new Error("No records found in Action Network");
  }

  const result = await adaptor.fetchByExternalId([firstRecord.externalId]);
  expect(result.length).toBe(1);
  expect(result[0]).toHaveProperty("externalId", firstRecord.externalId);
  expect(result[0]).toHaveProperty("json");
});

test("fetchByExternalId handles multiple IDs", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Get first few records
  const records = [];
  let count = 0;
  for await (const rec of adaptor.fetchAll()) {
    records.push(rec);
    count++;
    if (count >= 3) break; // Get 3 records for testing
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

test("updateRecords attempts to update records", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Get a record first
  const firstRecord = await adaptor.fetchFirst();
  if (!firstRecord) {
    throw new Error("No records found in Action Network");
  }

  const newValue = "test-value-" + Date.now(); // Unique value to verify update
  const enrichedRecords = [
    {
      externalRecord: firstRecord,
      columns: [
        {
          def: { name: "test_custom_field", type: ColumnType.String },
          value: newValue,
        },
      ],
    },
  ];

  await adaptor.updateRecords(enrichedRecords);

  const updatedRecords = await adaptor.fetchByExternalId([
    firstRecord.externalId,
  ]);

  expect(updatedRecords[0].json["test_custom_field"]).toBe(newValue);
});

test("normalizeRecord handles various record formats", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Test the private normalizeRecord method by getting a real record
  const firstRecord = await adaptor.fetchFirst();
  if (!firstRecord) {
    throw new Error("No records found in Action Network");
  }

  // Verify the normalized record has expected structure
  expect(firstRecord.json).toBeTypeOf("object");
  expect(firstRecord.externalId).toBeTypeOf("string");
  expect(firstRecord.externalId.length).toBeGreaterThan(0);
});

test("extractExternalRecordIdsFromWebhookBody handles malformed payloads", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Test with null/undefined body
  await expect(async () => {
    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      null,
    )) {
      ids.push(id);
    }
  }).rejects.toThrow("Empty Action Network webhook body");

  // Test with malformed payload (should not yield any IDs)
  const malformedBody = { invalid: "payload" };
  const ids = [];
  for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
    malformedBody,
  )) {
    ids.push(id);
  }
  expect(ids).toHaveLength(0);
});

test("fetchByExternalId respects batch size limit", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Create an array larger than DATA_RECORDS_JOB_BATCH_SIZE (100)
  const tooManyIds = Array.from({ length: 101 }, (_, i) => `id-${i}`);

  await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
    "Cannot fetch more than 100 records at once.",
  );
});
