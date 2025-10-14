import { v4 as uuidv4 } from "uuid";
import { describe, expect, inject, test } from "vitest";
import { GoogleSheetsAdaptor } from "@/server/adaptors/googlesheets";
import { ColumnType } from "@/server/models/DataSource";
import { getPublicUrl } from "@/server/services/urls";
import { ColumnType } from "@/server/models/DataSource";

const credentials = inject("credentials");

const uuid = uuidv4();

describe("Google Sheets adaptor tests", () => {
  test("Connection succeeds", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );
    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toHaveProperty("externalId");
  });

  test("extractExternalRecordIdsFromWebhookBody yields external IDs for rowNumber", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    const body = {
      rowNumber: "5",
    };

    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }

    expect(ids).toContain("5");
    expect(ids).toHaveLength(1);
  });

  test("extractExternalRecordIdsFromWebhookBody yields all external IDs for rowCount", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    const body = {
      rowCount: "5",
    };

    const ids = [];
    for await (const id of adaptor.extractExternalRecordIdsFromWebhookBody(
      body,
    )) {
      ids.push(id);
    }

    expect(ids.length).toBeGreaterThan(10);
    // All IDs should be numeric strings representing row numbers
    ids.forEach((id) => {
      expect(Number.isInteger(parseInt(id))).toBe(true);
    });
  });

  test("getRecordCount returns a number", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    const count = await adaptor.getRecordCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("fetchFirst returns first data record", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    const firstRecord = await adaptor.fetchFirst();

    if (firstRecord) {
      expect(firstRecord).toHaveProperty("externalId", "2"); // Second row (first data row)
      expect(firstRecord).toHaveProperty("json");
      expect(typeof firstRecord.json).toBe("object");
    }
  });

  test("fetchAll yields records", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    const results = [];
    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("externalId");
    expect(results[0]).toHaveProperty("json");

    // External IDs should be row numbers starting from 2 (after header)
    expect(parseInt(results[0].externalId)).toBeGreaterThanOrEqual(2);
  });

  test("fetchByExternalId returns specific records", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    // Get some records first
    const allRecords = [];
    for await (const rec of adaptor.fetchAll()) {
      allRecords.push(rec);
      if (allRecords.length >= 2) break; // Just get first 2 for testing
    }

    if (allRecords.length === 0) throw new Error("No records in sheet");

    const targetIds = allRecords
      .slice(0, Math.min(2, allRecords.length))
      .map((r) => r.externalId);
    const result = await adaptor.fetchByExternalId(targetIds);

    expect(result.length).toBe(targetIds.length);
    expect(result[0]).toHaveProperty("externalId", targetIds[0]);
    expect(result[0]).toHaveProperty("json");
  });

  test("fetchByExternalId throws error for too many records", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    // Create array with 101 IDs (more than DATA_RECORDS_JOB_BATCH_SIZE)
    const tooManyIds = Array.from({ length: 101 }, (_, i) =>
      (i + 2).toString(),
    );

    await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
      "Cannot fetch more than 100 records at once.",
    );
  });

  test("webhooks - toggle on and off", async () => {
    const baseUrl = await getPublicUrl();
    const baseDomain = new URL(baseUrl).hostname;

    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    await adaptor.toggleWebhook(true);

    let sheets = await adaptor.listSheets();
    expect(sheets.some((s) => s.properties.title.includes(baseDomain))).toBe(
      true,
    );

    await adaptor.toggleWebhook(false);

    sheets = await adaptor.listSheets();
    expect(sheets.some((s) => s.properties.title.includes(baseDomain))).toBe(
      false,
    );
  });

  test("removeDevWebhooks removes webhooks without error", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    await adaptor.toggleWebhook(true);

    await adaptor.removeDevWebhooks();

    const sheets = await adaptor.listSheets();
    expect(sheets.some((s) => s.properties.title.includes("ngrok"))).toBe(
      false,
    );
  });

  test("updateRecords updates existing records", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    // Get a record to update
    const allRecords = [];
    for await (const rec of adaptor.fetchAll()) {
      allRecords.push(rec);
      break; // Just get the first record
    }

    if (allRecords.length === 0) throw new Error("No records in sheet");

    const newValue = "test-value-" + Date.now(); // Unique value to verify update
    const enrichedRecords = [
      {
        externalRecord: allRecords[0],
        columns: [
          {
            def: { name: "Mapped: Test Field", type: ColumnType.String },
            value: newValue,
          },
        ],
      },
    ];

    // This should not throw an error
    await adaptor.updateRecords(enrichedRecords);

    const updatedRecord = await adaptor.fetchByExternalId(["2"]);
    expect(updatedRecord[0].json["Mapped: Test Field"]).toBe(newValue);
  });

  test("updateRecords adds new columns", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    // Get a record to update
    const allRecords = [];
    for await (const rec of adaptor.fetchAll()) {
      allRecords.push(rec);
      break; // Just get the first record
    }

    if (allRecords.length === 0) throw new Error("No records in sheet");

    const uniqueColumnName = "NewTestField_" + Date.now();
    const enrichedRecords = [
      {
        externalRecord: allRecords[0],
        columns: [
          {
            def: { name: uniqueColumnName, type: ColumnType.String },
            value: "new-column-value",
          },
        ],
      },
    ];

    // This should create a new column and update the record
    await adaptor.updateRecords(enrichedRecords);

    const updatedRecord = await adaptor.fetchByExternalId(["2"]);
    expect(updatedRecord[0].json[uniqueColumnName]).toBe("new-column-value");

    await adaptor.deleteColumn(uniqueColumnName, 2);
  });

  test("updateRecords handles multiple records in batches", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

    // Get multiple records to update
    const allRecords = [];
    for await (const rec of adaptor.fetchAll()) {
      allRecords.push(rec);
      if (allRecords.length >= 3) break; // Get up to 3 records for batch testing
    }

    if (allRecords.length === 0) throw new Error("No records in sheet");

    const newValue = `batch-test-value-${Date.now()}`;
    const enrichedRecords = allRecords.map((record) => ({
      externalRecord: record,
      columns: [
        {
          def: { name: "BatchTestField", type: ColumnType.String },
          value: newValue,
        },
      ],
    }));

    // This should handle multiple records
    await adaptor.updateRecords(enrichedRecords);

    const updatedRecord = await adaptor.fetchByExternalId(["2", "3", "4", "5"]);
    expect(updatedRecord[0].json["BatchTestField"]).toBe(newValue);
    expect(updatedRecord[1].json["BatchTestField"]).toBe(newValue);
    expect(updatedRecord[2].json["BatchTestField"]).toBe(newValue);
    expect(updatedRecord[3].json["Name"]).toBeTruthy(); // Check not all records were updated
    expect(updatedRecord[3].json["BatchTestField"]).toBeFalsy();
  });

  test("tagRecords attempts to tag records", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      credentials.googlesheets.oAuthCredentials,
    );

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

    expect(String(updatedRecords[0].json["My View"]).toLowerCase()).toBe(
      "true",
    );

    taggedRecords[0].tag.present = false;
    await adaptor.tagRecords(taggedRecords);
    updatedRecords = await adaptor.fetchByExternalId([firstRecord.externalId]);

    expect(String(updatedRecords[0].json["My View"]).toLowerCase()).toBe(
      "false",
    );
  });

  test("access token refresh works when token is expired", async () => {
    // Create adaptor with expired token
    const expiredCredentials = {
      ...credentials.googlesheets.oAuthCredentials,
      access_token: "expired_token",
      expiry_date: Date.now() - 1000, // Expired 1 second ago
    };

    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      credentials.googlesheets.sheetName,
      expiredCredentials,
    );

    // This should trigger token refresh and still work
    const count = await adaptor.getRecordCount();
    expect(typeof count).toBe("number");
  });

  test("handles empty sheet gracefully", async () => {
    const adaptor = new GoogleSheetsAdaptor(
      uuid,
      credentials.googlesheets.spreadsheetId,
      "EmptySheet", // Assumes test sheet exists
      credentials.googlesheets.oAuthCredentials,
    );

    const count = await adaptor.getRecordCount();
    expect(count).toBe(0);

    const firstRecord = await adaptor.fetchFirst();
    expect(firstRecord).toBeNull();

    const allRecords = [];
    for await (const rec of adaptor.fetchAll()) {
      allRecords.push(rec);
    }
    expect(allRecords).toHaveLength(0);
  });
}, 60000);
