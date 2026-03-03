import { afterAll, describe, expect, test } from "vitest";
import importDataSource from "@/server/jobs/importDataSource";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { dataRecordRouter } from "@/server/trpc/routers/dataRecord";

describe("dataRecord router tests", () => {
  const toRemove: string[] = [];

  test("byAreaCode returns exact and approximate matches", async () => {
    // 1. Create test data source
    const org = await upsertOrganisation({
      name: "Test Data Record Matching Org",
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
      public: true,
    });

    toRemove.push(dataSource.id);

    // 3. Call importDataSource
    await importDataSource({ dataSourceId: dataSource.id });

    const recordsByRegion = await dataRecordRouter.byAreaCode({
      ctx: {},
      getRawInput: async () => ({
        areaCode: "E15000008",
        areaSetCode: "UKR18",
        dataSourceId: dataSource.id,
      }),
      path: "",
      type: "query",
      signal: undefined,
    });
    expect(recordsByRegion.match).toBe("Contains");
    expect(
      recordsByRegion.records
        .toSorted(
          (a, b) =>
            (a.geocodeResult?.samplePoint?.lat || 0) -
            (b.geocodeResult?.samplePoint?.lat || 0),
        )
        .map((r) => ({ json: r.json, geocodeResult: r.geocodeResult })),
    ).toStrictEqual([
      {
        geocodeResult: {
          areas: {
            UKR18: "E15000008",
            WMC24: "E14001088",
          },
          centralPoint: {
            lat: 50.941346031,
            lng: 0.469231154,
          },
          samplePoint: {
            lat: 50.940436323,
            lng: 0.529765593,
          },
        },
        json: {
          Code: "E14001088",
          Electorate: 72198,
          Name: "Bexhill and Battle",
        },
      },
      {
        geocodeResult: {
          areas: {
            UKR18: "E15000008",
            WMC24: "E14001071",
          },
          centralPoint: {
            lat: 51.847510949,
            lng: -0.7207737,
          },
          samplePoint: {
            lat: 51.840793739,
            lng: -0.620908118,
          },
        },
        json: {
          Code: "E14001071",
          Electorate: 79169,
          Name: "Aylesbury",
        },
      },
    ]);

    const recordsByConstituency = await dataRecordRouter.byAreaCode({
      ctx: {},
      getRawInput: async () => ({
        areaCode: "E14001088",
        areaSetCode: "WMC24",
        dataSourceId: dataSource.id,
      }),
      path: "",
      type: "query",
      signal: undefined,
    });
    expect(recordsByConstituency.match).toBe("Exact");
    expect(
      recordsByConstituency.records.map((r) => ({
        json: r.json,
        geocodeResult: r.geocodeResult,
      })),
    ).toStrictEqual([
      {
        geocodeResult: {
          areas: {
            UKR18: "E15000008",
            WMC24: "E14001088",
          },
          centralPoint: {
            lat: 50.941346031,
            lng: 0.469231154,
          },
          samplePoint: {
            lat: 50.940436323,
            lng: 0.529765593,
          },
        },
        json: {
          Code: "E14001088",
          Electorate: 72198,
          Name: "Bexhill and Battle",
        },
      },
    ]);

    const recordsByWard = await dataRecordRouter.byAreaCode({
      ctx: {},
      getRawInput: async () => ({
        areaCode: "E05011618",
        areaSetCode: "W25",
        dataSourceId: dataSource.id,
      }),
      path: "",
      type: "query",
      signal: undefined,
    });
    expect(recordsByWard.match).toBe("ContainedBy");
    expect(
      recordsByWard.records.map((r) => ({
        json: r.json,
        geocodeResult: r.geocodeResult,
      })),
    ).toStrictEqual([
      {
        geocodeResult: {
          areas: {
            UKR18: "E15000008",
            WMC24: "E14001088",
          },
          centralPoint: {
            lat: 50.941346031,
            lng: 0.469231154,
          },
          samplePoint: {
            lat: 50.940436323,
            lng: 0.529765593,
          },
        },
        json: {
          Code: "E14001088",
          Electorate: 72198,
          Name: "Bexhill and Battle",
        },
      },
    ]);

    const recordsByWardApproximate = await dataRecordRouter.byAreaCode({
      ctx: {},
      getRawInput: async () => ({
        areaCode: "E05011615",
        areaSetCode: "W25",
        dataSourceId: dataSource.id,
      }),
      path: "",
      type: "query",
      signal: undefined,
    });
    expect(recordsByWardApproximate.match).toBe("Approximate");
    expect(
      recordsByWardApproximate.records.map((r) => ({
        json: r.json,
        geocodeResult: r.geocodeResult,
      })),
    ).toStrictEqual([
      {
        geocodeResult: {
          areas: {
            UKR18: "E15000008",
            WMC24: "E14001088",
          },
          centralPoint: {
            lat: 50.941346031,
            lng: 0.469231154,
          },
          samplePoint: {
            lat: 50.940436323,
            lng: 0.529765593,
          },
        },
        json: {
          Code: "E14001088",
          Electorate: 72198,
          Name: "Bexhill and Battle",
        },
      },
    ]);

    const recordsByWardNone = await dataRecordRouter.byAreaCode({
      ctx: {},
      getRawInput: async () => ({
        areaCode: "E05011650",
        areaSetCode: "W25",
        dataSourceId: dataSource.id,
      }),
      path: "",
      type: "query",
      signal: undefined,
    });
    expect(recordsByWardNone.match).toBe("Approximate");
    expect(
      recordsByWardNone.records.map((r) => ({
        json: r.json,
        geocodeResult: r.geocodeResult,
      })),
    ).toStrictEqual([]);
  });

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });
});
