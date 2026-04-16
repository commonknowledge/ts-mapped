import { afterAll, describe, expect, test, vi } from "vitest";
import { AreaSetCode } from "@/models/AreaSet";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { FilterType } from "@/models/MapView";
import importDataRecords from "@/server/jobs/importDataRecords";
import importDataSource from "@/server/jobs/importDataSource";
import * as geocodeModule from "@/server/mapping/geocode";
import {
  markDataRecordsAsDirty,
  streamDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";

const getRecords = async (dataSourceId: string) => {
  const stream = streamDataRecordsByDataSource(
    dataSourceId,
    { type: FilterType.MULTI },
    "",
  );
  const records = [];
  for await (const record of stream) {
    records.push({
      externalId: record.externalId,
      json: record.json,
      geocodeResult: record.geocodeResult,
      geocodePoint: record.geocodePoint,
    });
  }
  records.sort((a, b) => a.externalId.localeCompare(b.externalId));
  return records;
};

describe("importDataRecords", () => {
  const toRemove: string[] = [];

  test("skips geocoding when record JSON is unchanged", async () => {
    const org = await upsertOrganisation({
      name: "Test importDataRecords Org",
    });

    const dataSource = await createDataSource({
      name: "Test importDataRecords CSV",
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
      geocodingConfig: {
        type: GeocodingType.Code,
        column: "Postcode",
        areaSetCode: AreaSetCode.PC,
      },
      organisationId: org.id,
      public: false,
    });

    toRemove.push(dataSource.id);

    // 1. Initial full import — geocodes all records
    await importDataSource({ dataSourceId: dataSource.id });
    const recordsAfterFirstImport = await getRecords(dataSource.id);

    // Sanity check: records were geocoded
    const geocodedRecords = recordsAfterFirstImport.filter(
      (r) => r.geocodeResult !== null,
    );
    expect(geocodedRecords.length).toBeGreaterThan(0);

    // 2. Mark all records as needing import (simulates webhook)
    const allExternalIds = recordsAfterFirstImport.map((r) => r.externalId);
    await markDataRecordsAsDirty(allExternalIds, dataSource.id);

    // 3. Spy on geocodeRecord to count calls
    const geocodeSpy = vi.spyOn(geocodeModule, "geocodeRecord");

    // 4. Run importDataRecords — data hasn't changed, so geocode should be skipped
    await importDataRecords({ dataSourceId: dataSource.id });

    // 5. Verify geocodeRecord was never called
    expect(geocodeSpy).not.toHaveBeenCalled();

    // 6. Verify records still have their geocode results
    const recordsAfterSecondImport = await getRecords(dataSource.id);
    expect(recordsAfterSecondImport).toEqual(recordsAfterFirstImport);

    geocodeSpy.mockRestore();
  });

  test("re-geocodes when record JSON has changed", async () => {
    const org = await upsertOrganisation({
      name: "Test importDataRecords Changed Org",
    });

    const dataSource = await createDataSource({
      name: "Test importDataRecords Changed CSV",
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
      geocodingConfig: {
        type: GeocodingType.Code,
        column: "Postcode",
        areaSetCode: AreaSetCode.PC,
      },
      organisationId: org.id,
      public: false,
    });

    toRemove.push(dataSource.id);

    // 1. Initial full import
    await importDataSource({ dataSourceId: dataSource.id });

    // 2. Manually alter a record's JSON in the DB to simulate a change
    //    (the CSV will return the original data, which differs from the altered DB data)
    await db
      .updateTable("dataRecord")
      .set({
        json: { Name: "ALTERED", Postcode: "TN4 0PP", Notes: "" },
      })
      .where("dataSourceId", "=", dataSource.id)
      .where("externalId", "=", "1")
      .execute();

    // 3. Mark record 1 as needing import
    await markDataRecordsAsDirty(["1"], dataSource.id);

    // 4. Spy on geocodeRecord
    const geocodeSpy = vi.spyOn(geocodeModule, "geocodeRecord");

    // 5. Run importDataRecords — record 1's JSON has changed, so it should re-geocode
    await importDataRecords({ dataSourceId: dataSource.id });

    // 6. Verify geocodeRecord was called exactly once (for record 1)
    expect(geocodeSpy).toHaveBeenCalledTimes(1);

    geocodeSpy.mockRestore();
  });

  test("handles deep equality correctly when JSON key order differs", async () => {
    const org = await upsertOrganisation({
      name: "Test importDataRecords Key Order Org",
    });

    const dataSource = await createDataSource({
      name: "Test importDataRecords Key Order CSV",
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
      geocodingConfig: {
        type: GeocodingType.Code,
        column: "Postcode",
        areaSetCode: AreaSetCode.PC,
      },
      organisationId: org.id,
      public: false,
    });

    toRemove.push(dataSource.id);

    // 1. Initial full import
    await importDataSource({ dataSourceId: dataSource.id });
    const recordsAfterFirstImport = await getRecords(dataSource.id);

    // 2. Manually reorder JSON keys in the DB for record 1
    //    Same values, different key order — should still be treated as unchanged
    const record1 = recordsAfterFirstImport.find((r) => r.externalId === "1");
    if (!record1) throw new Error("record1 not found");
    const reorderedJson = {
      Notes: record1.json.Notes,
      Postcode: record1.json.Postcode,
      Name: record1.json.Name,
    };

    await db
      .updateTable("dataRecord")
      .set({ json: reorderedJson })
      .where("dataSourceId", "=", dataSource.id)
      .where("externalId", "=", "1")
      .execute();

    // 3. Mark record 1 as needing import
    await markDataRecordsAsDirty(["1"], dataSource.id);

    // 4. Spy on geocodeRecord
    const geocodeSpy = vi.spyOn(geocodeModule, "geocodeRecord");

    // 5. Run importDataRecords — keys are reordered but values are the same
    await importDataRecords({ dataSourceId: dataSource.id });

    // 6. isDeepStrictEqual ignores key order, so this should NOT re-geocode
    expect(geocodeSpy).not.toHaveBeenCalled();

    // 7. Geocode results should be preserved
    const recordsAfterSecondImport = await getRecords(dataSource.id);
    const record1After = recordsAfterSecondImport.find(
      (r) => r.externalId === "1",
    );
    expect(record1After?.geocodeResult).toEqual(record1?.geocodeResult);

    geocodeSpy.mockRestore();
  });

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });
}, 30000);
