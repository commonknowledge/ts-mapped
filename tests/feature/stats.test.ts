import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetCode } from "@/models/AreaSet";

import {
  ColumnType,
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { CalculationType } from "@/models/MapView";
import importDataSource from "@/server/jobs/importDataSource";
import {
  createDataSource,
  deleteDataSource,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { getAreaStats } from "@/server/stats";

describe("getAreaStats tests", () => {
  let dataSourceId: string;

  beforeAll(async () => {
    const org = await upsertOrganisation({
      name: "Test Stats Org",
    });

    const dataSource = await createDataSource({
      name: "Test Import Stats CSV Source",
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Data,
      config: {
        type: DataSourceType.CSV,
        url: `file://tests/resources/stats.csv?${uuidv4()}`,
      },
      columnDefs: [],
      columnMetadata: [],
      inspectorColumns: [],
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

    dataSourceId = dataSource.id;
    await importDataSource({ dataSourceId: dataSource.id });
  });

  afterAll(async () => {
    if (dataSourceId) {
      await deleteDataSource(dataSourceId);
    }
  });

  const sortStats = (stats: { areaCode: string; value?: unknown }[]) => {
    stats.sort((a, b) => (a.areaCode < b.areaCode ? -1 : 1));
  };

  describe("nullIsZero = false (default)", () => {
    test("Sum", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 79169,
          minValue: 71002,
          stats: [
            { areaCode: "E14001071", value: 79169 },
            { areaCode: "E14001088", value: 72199 },
            { areaCode: "E14001092", value: 71002 },
            { areaCode: "E14001225", value: 72481 },
          ],
        },
      });
    });

    test("Average", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Avg,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Avg,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 79169,
          minValue: 71002,
          stats: [
            { areaCode: "E14001071", value: 79169 },
            { areaCode: "E14001088", value: 72199 },
            { areaCode: "E14001092", value: 71002 },
            { areaCode: "E14001225", value: 72481 },
          ],
        },
      });
    });

    test("Mode", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment",
          columnType: ColumnType.Number,
          maxValue: 3,
          minValue: 1,
          stats: [
            { areaCode: "E14001071", value: 1 },
            { areaCode: "E14001088", value: 2 },
            { areaCode: "E14001202", value: 1 },
            { areaCode: "E14001225", value: 3 },
          ],
        },
      });
    });

    test("Mode (Segment name)", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment name",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment name",
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: "Normal" },
            { areaCode: "E14001088", value: "Weird" },
            { areaCode: "E14001202", value: "Normal" },
            { areaCode: "E14001225", value: "Unusual" },
          ],
        },
      });
    });

    test("Highest value column", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: MAX_COLUMN_KEY,
        includeColumns: ["Lab %", "Con %"],
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: MAX_COLUMN_KEY,
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: "Con %" },
            { areaCode: "E14001088", value: "Lab %" },
            { areaCode: "E14001092", value: "Lab %" },
            { areaCode: "E14001202", value: "Lab %" },
            { areaCode: "E14001225", value: "Con %" },
          ],
        },
      });
    });
  });

  describe("nullIsZero = true", () => {
    beforeAll(async () => {
      await updateDataSource(dataSourceId, { nullIsZero: true });
    });

    afterAll(async () => {
      await updateDataSource(dataSourceId, { nullIsZero: false });
    });

    test("Sum", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 79169,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: 79169 },
            { areaCode: "E14001088", value: 72199 },
            { areaCode: "E14001092", value: 71002 },
            { areaCode: "E14001202", value: 0 },
            { areaCode: "E14001225", value: 72481 },
          ],
        },
      });
    });

    test("Average", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Avg,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Avg,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 79169,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: 79169 },
            { areaCode: "E14001088", value: 72199 },
            { areaCode: "E14001092", value: 71002 },
            { areaCode: "E14001202", value: 0 },
            { areaCode: "E14001225", value: 72481 },
          ],
        },
      });
    });

    test("Mode", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment",
          columnType: ColumnType.Number,
          maxValue: 3,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: 1 },
            { areaCode: "E14001088", value: 2 },
            { areaCode: "E14001092", value: 0 },
            { areaCode: "E14001202", value: 1 },
            { areaCode: "E14001225", value: 3 },
          ],
        },
      });
    });

    test("Mode (Segment name)", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.WMC24,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment name",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.WMC24,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment name",
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            { areaCode: "E14001071", value: "Normal" },
            { areaCode: "E14001088", value: "Weird" },
            // Even when nullIsZero is true, empty string values are still filtered out
            // because the meaning is unknown
            // { areaCode: "E14001092", value: "" },
            { areaCode: "E14001202", value: "Normal" },
            { areaCode: "E14001225", value: "Unusual" },
          ],
        },
      });
    });
  });

  describe("UKR18 - nullIsZero = false (default)", () => {
    test("Sum", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 151368,
          minValue: 72481,
          stats: [
            {
              areaCode: "E15000007",
              value: 72481,
            },
            {
              areaCode: "E15000008",
              value: 151368,
            },
          ],
        },
      });
    });

    test("Average", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Avg,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Avg,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 75684,
          minValue: 72481,
          stats: [
            {
              areaCode: "E15000007",
              value: 72481,
            },
            {
              areaCode: "E15000008",
              value: 75684,
            },
          ],
        },
      });
    });

    test("Mode", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment",
          columnType: ColumnType.Number,
          maxValue: 3,
          minValue: 1,
          stats: [
            {
              areaCode: "E15000007",
              value: 3,
            },
            {
              areaCode: "E15000008",
              value: 1,
            },
          ],
        },
      });
    });

    test("Mode (Segment name)", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment name",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment name",
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            {
              areaCode: "E15000007",
              value: "Unusual",
            },
            {
              areaCode: "E15000008",
              value: "Normal",
            },
          ],
        },
      });
    });

    test("Highest value column", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: MAX_COLUMN_KEY,
        includeColumns: ["Lab %", "Con %"],
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: MAX_COLUMN_KEY,
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            { areaCode: "E15000007", value: "Con %" },
            { areaCode: "E15000008", value: "Lab %" },
          ],
        },
      });
    });
  });

  describe("UKR18 - nullIsZero = true", () => {
    beforeAll(async () => {
      await updateDataSource(dataSourceId, { nullIsZero: true });
    });

    afterAll(async () => {
      await updateDataSource(dataSourceId, { nullIsZero: false });
    });

    test("Sum", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Sum,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Sum,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 151368,
          minValue: 72481,
          stats: [
            {
              areaCode: "E15000007",
              value: 72481,
            },
            {
              areaCode: "E15000008",
              value: 151368,
            },
          ],
        },
      });
    });

    test("Average", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Avg,
        column: "Electorate",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Avg,
        dataSourceId,
        primary: {
          column: "Electorate",
          columnType: ColumnType.Number,
          maxValue: 72481,
          minValue: 50456,
          stats: [
            {
              areaCode: "E15000007",
              value: 72481,
            },
            {
              areaCode: "E15000008",
              value: 50456,
            },
          ],
        },
      });
    });

    test("Mode", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment",
          columnType: ColumnType.Number,
          maxValue: 3,
          minValue: 1,
          stats: [
            {
              areaCode: "E15000007",
              value: 3,
            },
            {
              areaCode: "E15000008",
              value: 1,
            },
          ],
        },
      });
    });

    test("Mode (Segment name)", async () => {
      const areaStats = await getAreaStats({
        areaSetCode: AreaSetCode.UKR18,
        dataSourceId,
        calculationType: CalculationType.Mode,
        column: "Segment name",
      });

      const stats = areaStats.primary?.stats ?? [];
      sortStats(stats);

      expect(areaStats).toEqual({
        areaSetCode: AreaSetCode.UKR18,
        calculationType: CalculationType.Mode,
        dataSourceId,
        primary: {
          column: "Segment name",
          columnType: ColumnType.String,
          maxValue: 0,
          minValue: 0,
          stats: [
            {
              areaCode: "E15000007",
              value: "Unusual",
            },
            {
              areaCode: "E15000008",
              value: "Normal",
            },
          ],
        },
      });
    });
  });
});
