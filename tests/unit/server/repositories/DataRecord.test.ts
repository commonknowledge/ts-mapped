import { describe, expect, inject, test } from "vitest";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import {
  findDataRecordsByDataSource,
  markDataRecordsAsDirty,
  upsertDataRecord,
} from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";

const credentials = inject("credentials");

describe("webhook route tests", () => {
  test("markDataRecordsAsDirty does an upsert", async () => {
    // 1. Create test data source
    const org = await upsertOrganisation({
      name: "Test Webhook Org",
    });

    const dataSource = await createDataSource({
      name: "Test Webhook Airtable Source",
      autoEnrich: true,
      autoImport: true,
      recordType: DataSourceRecordType.Data,
      config: {
        type: DataSourceType.Airtable,
        apiKey: credentials.airtable.apiKey,
        baseId: credentials.airtable.baseId,
        tableId: credentials.airtable.tableId,
      },
      columnDefs: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: {
        type: GeocodingType.Code,
        column: "Postcode",
        areaSetCode: AreaSetCode.PC,
      },
      organisationId: org.id,
      public: false,
    });

    await upsertDataRecord({
      externalId: "abc",
      dataSourceId: dataSource.id,
      json: { foo: "bar" },
      needsImport: false,
      needsEnrich: false,
    });

    await markDataRecordsAsDirty(["abc", "def"], dataSource.id);

    const dataRecords = await findDataRecordsByDataSource(
      dataSource.id,
      null,
      null,
      0,
      [],
      true,
    );

    expect(dataRecords[0].externalId).toBe("abc");
    expect(dataRecords[0].json).toStrictEqual({ foo: "bar" });
    expect(dataRecords[0].needsImport).toBeTruthy();
    expect(dataRecords[0].needsEnrich).toBeTruthy();

    expect(dataRecords[1].externalId).toBe("def");
    expect(dataRecords[1].json).toStrictEqual({});
    expect(dataRecords[1].needsImport).toBeTruthy();
    expect(dataRecords[1].needsEnrich).toBeTruthy();

    await deleteDataSource(dataSource.id);
  });
});
