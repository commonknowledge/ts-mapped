import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, inject, test } from "vitest";
import { GoogleSheetsAdaptor } from "@/server/adaptors/googlesheets";
import enrichDataRecords from "@/server/jobs/enrichDataRecords";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import removeEnrichmentColumns from "@/server/jobs/removeEnrichmentColumns";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  AreaPropertyType,
  ColumnType,
  DataSourceRecordType,
  DataSourceType,
  EnrichmentSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
  findDataSourceById,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";

const credentials = inject("credentials");

const enrichmentCreds = credentials.enrichment.googlesheets;

async function createGoogleSheetsDataSource(
  orgId: string,
  enrichments: Parameters<typeof createDataSource>[0]["enrichments"] = [],
) {
  return createDataSource({
    name: `Test Enrich GSheets ${uuidv4()}`,
    autoEnrich: false,
    autoImport: false,
    recordType: DataSourceRecordType.Members,
    config: {
      type: DataSourceType.GoogleSheets,
      spreadsheetId: enrichmentCreds.spreadsheetId,
      sheetName: enrichmentCreds.sheetName,
      oAuthCredentials: enrichmentCreds.oAuthCredentials,
    },
    columnDefs: [],
    columnMetadata: [],
    columnRoles: { nameColumns: [] },
    enrichments,
    geocodingConfig: {
      type: GeocodingType.Code,
      column: "Postcode",
      areaSetCode: AreaSetCode.PC,
    },
    organisationId: orgId,
    public: false,
  });
}

async function getRecords(dataSourceId: string) {
  const stream = streamDataRecordsByDataSource(
    dataSourceId,
    { type: FilterType.MULTI },
    "",
  );
  const records = [];
  for await (const record of stream) {
    records.push(record);
  }
  return records;
}

describe("enrichDataSource tests", () => {
  const toRemove: string[] = [];

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });

  test("enrichDataSource enriches records and updates data_record.json and columnDefs", async () => {
    // 1. Create test organisation
    const org = await upsertOrganisation({
      name: "Test Enrich Org",
    });

    const enrichmentColumnName = "Mapped: Region";

    // 2. Create data source with Area enrichment
    const dataSource = await createGoogleSheetsDataSource(org.id, [
      {
        name: "Region",
        sourceType: EnrichmentSourceType.Area,
        areaSetCode: AreaSetCode.UKR18,
        areaProperty: AreaPropertyType.Name,
      },
    ]);
    toRemove.push(dataSource.id);

    // 3. Import the data source first to populate data_record rows
    const importResult = await importDataSource({
      dataSourceId: dataSource.id,
    });
    expect(importResult).toBe(true);

    // 4. Verify records were imported
    const recordsBefore = await getRecords(dataSource.id);
    expect(recordsBefore.length).toBeGreaterThan(0);

    // Verify no enrichment column exists yet in data_record.json
    for (const record of recordsBefore) {
      expect(record.json).not.toHaveProperty(enrichmentColumnName);
    }

    // 5. Run enrichDataSource
    const enrichResult = await enrichDataSource({
      dataSourceId: dataSource.id,
    });
    expect(enrichResult).toBe(true);

    // 6. Verify data_record.json was updated with enrichment columns
    const recordsAfter = await getRecords(dataSource.id);
    const enrichedRecords = recordsAfter.filter(
      (r) => r.json[enrichmentColumnName] !== undefined,
    );
    // At least some records should have been enriched
    // (some may fail geocoding and not get enriched)
    expect(enrichedRecords.length).toBeGreaterThan(0);

    // Verify the enrichment value is a string (Area enrichments produce strings)
    for (const record of enrichedRecords) {
      expect(typeof record.json[enrichmentColumnName]).toBe("string");
      expect(
        (record.json[enrichmentColumnName] as string).length,
      ).toBeGreaterThan(0);
    }

    // 7. Verify columnDefs was updated
    const updatedDataSource = await findDataSourceById(dataSource.id);
    expect(updatedDataSource).toBeDefined();

    const enrichmentColDef = updatedDataSource?.columnDefs.find(
      (c) => c.name === enrichmentColumnName,
    );
    expect(enrichmentColDef).toEqual({
      name: enrichmentColumnName,
      type: ColumnType.String,
    });

    // 8. Verify enrichment column was created in the external data source
    const adaptor = new GoogleSheetsAdaptor(
      dataSource.id,
      enrichmentCreds.spreadsheetId,
      enrichmentCreds.sheetName,
      enrichmentCreds.oAuthCredentials,
    );
    const externalRecord = await adaptor.fetchFirst();
    expect(externalRecord?.json).toHaveProperty(enrichmentColumnName);

    // 9. Run removeEnrichmentColumns to clean up
    const removeResult = await removeEnrichmentColumns({
      dataSourceId: dataSource.id,
      externalColumnNames: [enrichmentColumnName],
    });
    expect(removeResult).toBe(true);

    // 10. Verify column removed from external data source
    const recordAfterRemoval = await adaptor.fetchFirst();
    expect(recordAfterRemoval?.json).not.toHaveProperty(enrichmentColumnName);

    // 11. Verify columnDefs no longer includes the enrichment column
    const dsAfterRemoval = await findDataSourceById(dataSource.id);
    expect(
      dsAfterRemoval?.columnDefs.find((c) => c.name === enrichmentColumnName),
    ).toBeUndefined();

    // 12. Verify data_record.json no longer includes the enrichment column
    const recordsAfterRemoval = await getRecords(dataSource.id);
    for (const record of recordsAfterRemoval) {
      expect(record.json).not.toHaveProperty(enrichmentColumnName);
    }
  }, 30000);
});

describe("enrichDataRecords tests", () => {
  const toRemove: string[] = [];

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });

  test("enrichDataRecords enriches dirty records and updates data_record.json and columnDefs", async () => {
    // 1. Create test organisation
    const org = await upsertOrganisation({
      name: "Test Enrich Records Org",
    });

    const enrichmentColumnName = "Mapped: Region";

    // 2. Create data source with Area enrichment
    const dataSource = await createGoogleSheetsDataSource(org.id, [
      {
        name: "Region",
        sourceType: EnrichmentSourceType.Area,
        areaSetCode: AreaSetCode.UKR18,
        areaProperty: AreaPropertyType.Name,
      },
    ]);
    toRemove.push(dataSource.id);

    // 3. Import the data source first to populate data_record rows
    const importResult = await importDataSource({
      dataSourceId: dataSource.id,
    });
    expect(importResult).toBe(true);

    // 4. Verify records were imported
    const recordsBefore = await getRecords(dataSource.id);
    expect(recordsBefore.length).toBeGreaterThan(0);

    // 5. Mark all records as needing enrichment
    await db
      .updateTable("dataRecord")
      .set({ needsEnrich: true })
      .where("dataSourceId", "=", dataSource.id)
      .execute();

    // 6. Run enrichDataRecords (incremental enrich)
    const enrichResult = await enrichDataRecords({
      dataSourceId: dataSource.id,
    });
    expect(enrichResult).toBe(true);

    // 7. Verify data_record.json was updated with enrichment columns
    const recordsAfter = await getRecords(dataSource.id);
    const enrichedRecords = recordsAfter.filter(
      (r) => r.json[enrichmentColumnName] !== undefined,
    );
    expect(enrichedRecords.length).toBeGreaterThan(0);

    for (const record of enrichedRecords) {
      expect(typeof record.json[enrichmentColumnName]).toBe("string");
      expect(
        (record.json[enrichmentColumnName] as string).length,
      ).toBeGreaterThan(0);
    }

    // 8. Verify needsEnrich was reset to false
    const stillDirty = await db
      .selectFrom("dataRecord")
      .where("dataSourceId", "=", dataSource.id)
      .where("needsEnrich", "=", true)
      .select("id")
      .execute();
    expect(stillDirty.length).toBe(0);

    // 9. Verify columnDefs was updated
    const updatedDataSource = await findDataSourceById(dataSource.id);
    expect(updatedDataSource).toBeDefined();

    const enrichmentColDef = updatedDataSource?.columnDefs.find(
      (c) => c.name === enrichmentColumnName,
    );
    expect(enrichmentColDef).toEqual({
      name: enrichmentColumnName,
      type: ColumnType.String,
    });

    // 10. Verify enrichment column was created in the external data source
    const adaptor = new GoogleSheetsAdaptor(
      dataSource.id,
      enrichmentCreds.spreadsheetId,
      enrichmentCreds.sheetName,
      enrichmentCreds.oAuthCredentials,
    );
    const externalRecord = await adaptor.fetchFirst();
    expect(externalRecord?.json).toHaveProperty(enrichmentColumnName);

    // 11. Run removeEnrichmentColumns to clean up
    const removeResult = await removeEnrichmentColumns({
      dataSourceId: dataSource.id,
      externalColumnNames: [enrichmentColumnName],
    });
    expect(removeResult).toBe(true);

    // 12. Verify column removed from external data source
    const recordAfterRemoval = await adaptor.fetchFirst();
    expect(recordAfterRemoval?.json).not.toHaveProperty(enrichmentColumnName);

    // 13. Verify columnDefs no longer includes the enrichment column
    const dsAfterRemoval = await findDataSourceById(dataSource.id);
    expect(
      dsAfterRemoval?.columnDefs.find((c) => c.name === enrichmentColumnName),
    ).toBeUndefined();

    // 14. Verify data_record.json no longer includes the enrichment column
    const recordsAfterRemoval = await getRecords(dataSource.id);
    for (const record of recordsAfterRemoval) {
      expect(record.json).not.toHaveProperty(enrichmentColumnName);
    }
  }, 30000);
});
