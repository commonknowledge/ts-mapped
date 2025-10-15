import { expect, inject, test } from "vitest";
import { ActionNetworkAdaptor } from "@/server/adaptors/actionnetwork";
import { ColumnType } from "@/server/models/DataSource";
import type { ExternalRecord } from "@/types";

const credentials = inject("credentials");

test("Connection succeeds", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);
  const firstRow = await adaptor.fetchFirst();
  expect(firstRow).toHaveProperty("externalId");
});

test("extractExternalRecordIdsFromWebhookBody yields external IDs", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Mock Action Network webhook payload structure
  // Taken from AN official test webhook payload for Subscribed triggers
  const body = [
    {
      "osdi:signature": {
        identifiers: ["action_network:rec123"],
        comments: "Stop doing the thing",
        person: {
          family_name: "Smith",
          given_name: "John",
          postal_addresses: [{ primary: true, postal_code: "20009" }],
          email_addresses: [{ primary: true, address: "jsmith@mail.com" }],
          phone_numbers: [
            { primary: true, number: "11234567890", number_type: "Mobile" },
          ],
          custom_fields: { age: "31" },
        },
        "action_network:referrer_data": {},
        add_tags: ["volunteer", "member"],
        _links: {
          self: {
            href: "https://actionnetwork.org/api/v2/petitions/9f837109-710d-442f-8a99-857a21f36d25/signatures/d6bdf50e-c3a4-4981-a948-3d8c086066d7",
          },
          "osdi:petition": {
            href: "https://actionnetwork.org/api/v2/petitions/9f837109-710d-442f-8a99-857a21f36d25",
          },
          "osdi:person": {
            href: "https://actionnetwork.org/api/v2/people/699da712-929f-11e3-a2e9-12313d316c29",
          },
        },
      },
      "action_network:sponsor": {
        title: "Progressive Action Now",
        url: "https://actionnetwork.org/groups/progressive-action-now",
      },
      idempotency_key: "1679091c5a880faf6fb5e6087eb1b2dc",
    },
  ];

  const ids = [];
  for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
    body,
  )) {
    ids.push(id);
  }
  expect(ids).toContain("rec123");
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
  const result = (await adaptor.fetchPage({ page: 1, limit: 5 })) as {
    _embedded: { "osdi:people": ExternalRecord[] };
  };
  if (!result?._embedded) {
    throw new Error("No result from fetchPage");
  }
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

test("tagRecords attempts to tag records", async () => {
  const adaptor = new ActionNetworkAdaptor(credentials.actionnetwork.apiKey);

  // Get a record first
  const firstRecord = await adaptor.fetchFirst();
  if (!firstRecord) {
    throw new Error("No records found in Action Network");
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

  expect(updatedRecords[0].json["My View"]).toBe("true");

  taggedRecords[0].tag.present = false;
  await adaptor.tagRecords(taggedRecords);
  updatedRecords = await adaptor.fetchByExternalId([firstRecord.externalId]);

  expect(updatedRecords[0].json["My View"]).toBe("false");
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
