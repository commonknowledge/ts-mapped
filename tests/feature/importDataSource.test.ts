import { afterAll, describe, expect, test } from "vitest";
import importDataSource from "@/server/jobs/importDataSource";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  ColumnType,
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { CalculationType, FilterType } from "@/server/models/MapView";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
  findDataSourceById,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { getAreaStats } from "@/server/stats";

describe("importDataSource tests", () => {
  const toRemove: string[] = [];

  test("importDataSource imports records from CSV", async () => {
    // 1. Create test organisation
    const org = await upsertOrganisation({
      name: "Test Import Org",
    });

    // 2. Create test data source with CSV file
    const dataSource = await createDataSource({
      name: "Test Import CSV Source",
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Members,
      config: {
        type: DataSourceType.CSV,
        url: "file://tests/resources/members.csv",
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

    toRemove.push(dataSource.id);

    // 3. Call importDataSource
    await importDataSource({ dataSourceId: dataSource.id });

    // 4. Verify data record exists
    const stream = streamDataRecordsByDataSource(
      dataSource.id,
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

    // Clean up
    await deleteDataSource(dataSource.id);

    expect(
      records.map((r) => ({
        ...r,
        json: { Name: r.json.Name, Postcode: r.json.Postcode },
      })),
    ).toEqual([
      {
        externalId: "1",
        geocodePoint: { lat: 51.156594417, lng: 0.259700363 },
        geocodeResult: {
          areas: { PC: "TN40PP" },
          centralPoint: { lat: 51.156594417, lng: 0.259700363 },
          samplePoint: { lat: 51.15655915, lng: 0.25967437 },
        },
        json: {
          Name: "John",
          Postcode: "TN4 0PP",
        },
      },
      {
        externalId: "2",
        geocodePoint: { lat: 51.559292453, lng: -0.120000759 },
        geocodeResult: {
          areas: { PC: "N76AS" },
          centralPoint: { lat: 51.559292453, lng: -0.120000759 },
          samplePoint: { lat: 51.5592981, lng: -0.119958004 },
        },
        json: {
          Name: "Paul",
          Postcode: "N76AS",
        },
      },
      {
        externalId: "3",
        geocodePoint: { lat: 55.870966132, lng: -4.299308293 },
        geocodeResult: {
          areas: { PC: "G115RD" },
          centralPoint: { lat: 55.870966132, lng: -4.299308293 },
          samplePoint: { lat: 55.8709776, lng: -4.299245212 },
        },
        json: {
          Name: "George",
          Postcode: "G115RD",
        },
      },
      {
        externalId: "4",
        geocodePoint: {
          lat: 51.816849,
          lng: -0.81456,
        },
        geocodeResult: {
          areas: {
            PC: "HP202QB",
            WMC24: "E14001071",
          },
          centralPoint: {
            lat: 51.816849,
            lng: -0.81456,
          },
          samplePoint: {
            lat: 51.816849,
            lng: -0.81456,
          },
        },
        json: {
          Name: "Ringo",
          Postcode: "HP20 2QB",
        },
      },
      {
        externalId: "5",
        geocodePoint: {
          lat: 54.61832,
          lng: -5.927845,
        },
        geocodeResult: {
          areas: {
            PC: "BT153ES",
            WMC24: "N05000002",
          },
          centralPoint: {
            lat: 54.61832,
            lng: -5.927845,
          },
          samplePoint: {
            lat: 54.61832,
            lng: -5.927845,
          },
        },
        json: {
          Name: "Jane",
          Postcode: "BT15 3ES",
        },
      },
      {
        externalId: "6",
        geocodePoint: null,
        geocodeResult: null,
        json: {
          Name: "Mysterion",
          Postcode: "JE3 2DF",
        },
      },
    ]);
  });

  test("importDataSource imports stats from CSV", async () => {
    // 1. Create test organisation
    const org = await upsertOrganisation({
      name: "Test Import Org",
    });

    // 2. Create test data source with CSV file
    const dataSource = await createDataSource({
      name: "Test Import Stats CSV Source",
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Data,
      config: {
        type: DataSourceType.CSV,
        url: "file://tests/resources/stats.csv",
      },
      columnDefs: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: {
        type: GeocodingType.Code,
        column: "Code",
        areaSetCode: AreaSetCode.WMC24,
      },
      organisationId: org.id,
      public: false,
    });

    toRemove.push(dataSource.id);

    // 3. Call importDataSource
    await importDataSource({ dataSourceId: dataSource.id });

    const importedDataSource = await findDataSourceById(dataSource.id);
    const columnDefs = importedDataSource?.columnDefs;
    columnDefs?.sort((a, b) => (a.name < b.name ? -1 : 1));

    expect(columnDefs).toEqual([
      { name: "Code", type: ColumnType.String },
      { name: "Electorate", type: ColumnType.Number },
      { name: "Name", type: ColumnType.String },
    ]);

    const areaStats = await getAreaStats({
      areaSetCode: AreaSetCode.WMC24,
      dataSourceId: dataSource.id,
      calculationType: CalculationType.Sum,
      column: "Electorate",
      excludeColumns: [],
    });

    const stats = areaStats.primary?.stats;
    stats?.sort((a, b) => (a.areaCode < b.areaCode ? -1 : 1));

    // Remove stats array from main equality check
    areaStats.primary = undefined;

    expect(areaStats).toEqual({
      areaSetCode: AreaSetCode.WMC24,
      calculationType: CalculationType.Sum,
      dataSourceId: dataSource.id,
      primary: undefined,
    });

    expect(stats).toEqual([
      {
        areaCode: "E14001070",
        value: 71002,
      },
      {
        areaCode: "E14001071",
        value: 79169,
      },
    ]);
  });

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });
}, 10000);
