import { describe, expect, test } from "vitest";
import importDataSource from "@/server/jobs/importDataSource";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { streamDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";

describe("importDataSource tests", () => {
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
      recordType: DataSourceRecordType.Data,
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
        geocodePoint: { lat: 51.651882912, lng: -0.090255219 },
        geocodeResult: {
          areas: { PC: "EN26PJ" },
          centralPoint: { lat: 51.651882912, lng: -0.090255219 },
          samplePoint: { lat: 51.65194185, lng: -0.090364789 },
        },
        json: {
          Name: "Ringo",
          Postcode: "EN2 6PJ",
        },
      },
    ]);
  });
}, 10000);
