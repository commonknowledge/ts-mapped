import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, describe, expect, inject, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { AirtableAdaptor } from "@/server/adaptors/airtable";
import refreshWebhooks from "@/server/jobs/refreshWebhooks";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import {
  createWebhookRefreshLog,
  findWebhookRefreshLogsByDataSourceId,
} from "@/server/repositories/WebhookRefreshLog";

const credentials = inject("credentials");

describe("webhookRefreshLog tests", () => {
  const toRemove: string[] = [];

  afterEach(async () => {
    // Webhooks are filtered by public URL (not data source id), so a webhook
    // left over from one test would leak into the next on the same base.
    // Clear them after each test so every test starts from a clean base.
    try {
      await new AirtableAdaptor(
        "webhook-log-cleanup",
        credentials.airtable.apiKey,
        credentials.airtable.baseId,
        credentials.airtable.tableId,
      ).toggleWebhook(false);
    } catch {
      // best-effort cleanup
    }
  });

  afterAll(async () => {
    // Deleting the data sources cascades to their webhookRefreshLog rows
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });

  test("createWebhookRefreshLog round-trips arrays and details through JSONB", async () => {
    const org = await upsertOrganisation({ name: "Webhook Log Test Org" });
    const dataSource = await createDataSource({
      name: "Webhook Log CSV Source",
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Members,
      config: {
        type: DataSourceType.CSV,
        url: "file://tests/resources/members.csv",
      },
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: org.id,
      public: false,
    });
    toRemove.push(dataSource.id);

    const runId = uuidv4();
    const inserted = await createWebhookRefreshLog({
      runId,
      dataSourceId: dataSource.id,
      dataSourceType: DataSourceType.CSV,
      enabled: true,
      success: true,
      action: "recreated",
      oldWebhookIds: ["oldHook1", "oldHook2"],
      newWebhookIds: ["newHook1"],
      details: { expirationTime: "2026-07-01T00:00:00.000Z" },
    });

    // Defaults are populated by the database
    expect(inserted.id).toBeTruthy();
    expect(inserted.createdAt).toBeTruthy();

    const logs = await findWebhookRefreshLogsByDataSourceId(dataSource.id);
    expect(logs).toHaveLength(1);
    const log = logs[0];
    expect(log.runId).toBe(runId);
    expect(log.action).toBe("recreated");
    expect(log.enabled).toBe(true);
    expect(log.success).toBe(true);
    // JSONB arrays and objects come back as real JS values, not strings
    expect(log.oldWebhookIds).toEqual(["oldHook1", "oldHook2"]);
    expect(log.newWebhookIds).toEqual(["newHook1"]);
    expect(log.details).toEqual({
      expirationTime: "2026-07-01T00:00:00.000Z",
    });
  });

  test("refreshWebhooks logs a row for the processed Airtable data source", async () => {
    const org = await upsertOrganisation({ name: "Webhook Refresh Test Org" });
    const dataSource = await createDataSource({
      name: "Webhook Refresh Airtable Source",
      autoEnrich: false,
      autoImport: true,
      recordType: DataSourceRecordType.Members,
      config: {
        type: DataSourceType.Airtable,
        apiKey: credentials.airtable.apiKey,
        baseId: credentials.airtable.baseId,
        tableId: credentials.airtable.tableId,
      },
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: org.id,
      public: false,
    });
    toRemove.push(dataSource.id);

    await refreshWebhooks(null);

    const logs = await findWebhookRefreshLogsByDataSourceId(dataSource.id);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const log = logs[0];
    expect(log.dataSourceType).toBe(DataSourceType.Airtable);
    expect(log.enabled).toBe(true);
    expect(log.success).toBe(true);
    // autoImport is on with no valid webhook yet, so it is created (or
    // recreated/kept if one already existed for this base + public URL)
    expect(["created", "recreated", "kept"]).toContain(log.action);
    expect(log.newWebhookIds.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  test("refreshWebhooks logs a row when invoked for a single data source", async () => {
    const org = await upsertOrganisation({ name: "Webhook Single Test Org" });
    const dataSource = await createDataSource({
      name: "Webhook Single Airtable Source",
      autoEnrich: false,
      autoImport: true,
      recordType: DataSourceRecordType.Members,
      config: {
        type: DataSourceType.Airtable,
        apiKey: credentials.airtable.apiKey,
        baseId: credentials.airtable.baseId,
        tableId: credentials.airtable.tableId,
      },
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: org.id,
      public: false,
    });
    toRemove.push(dataSource.id);

    // This is the path the Google Sheets adaptor enqueues on row-count changes
    await refreshWebhooks({ dataSourceId: dataSource.id });

    const logs = await findWebhookRefreshLogsByDataSourceId(dataSource.id);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const log = logs[0];
    expect(log.dataSourceType).toBe(DataSourceType.Airtable);
    expect(log.enabled).toBe(true);
    expect(log.success).toBe(true);
    expect(["created", "recreated", "kept"]).toContain(log.action);
  }, 30000);
});
