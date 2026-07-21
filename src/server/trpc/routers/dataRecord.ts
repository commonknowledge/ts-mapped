import { TRPCError } from "@trpc/server";
import z from "zod";
import { getBooleanEnvVar } from "@/env";
import { AreaSetCode } from "@/models/AreaSet";
import { recordFilterSchema, recordSortSchema } from "@/models/MapView";
import { InspectorComparisonStat, pointSchema } from "@/models/shared";
import { reversePostcodeLookup } from "@/server/mapping/geocode";
import {
  findAreaByCode,
  findAreasByPoint,
  findAreasContaining,
} from "@/server/repositories/Area";
import {
  countDataRecordsForDataSource,
  findDataRecordById,
  findDataRecordsByDataSource,
  findDataRecordsByDataSourceAndAreaCode,
  findPageForDataRecord,
  getColumnStat,
} from "@/server/repositories/DataRecord";
import { geojsonPointToPoint } from "@/server/utils/geo";
import { DataRecordMatchType } from "@/types";
import { dataSourceReadProcedure, router } from "../index";

// Inclusive month-key range from the map timeline
const timelineRangeSchema = z.object({ start: z.number(), end: z.number() });

export const dataRecordRouter = router({
  findPageIndex: dataSourceReadProcedure
    .input(
      z.object({
        dataRecordId: z.string(),
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        sort: z.array(recordSortSchema).optional(),
        timelineRange: timelineRangeSchema.optional(),
      }),
    )
    .query(
      ({
        input: {
          dataRecordId,
          dataSourceId,
          filter,
          search,
          sort,
          timelineRange,
        },
      }) =>
        findPageForDataRecord(
          dataRecordId,
          dataSourceId,
          filter,
          search,
          sort || [],
          timelineRange,
        ),
    ),
  byId: dataSourceReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const record = await findDataRecordById(input.id);
      if (!record) {
        throw new TRPCError({
          message: "Data record not found",
          code: "NOT_FOUND",
        });
      }
      return record;
    }),
  byAreaCode: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        areaCode: z.string(),
      }),
    )
    .query(async ({ input, ctx: { dataSource } }) => {
      let records = await findDataRecordsByDataSourceAndAreaCode(
        input.dataSourceId,
        input.areaSetCode,
        input.areaCode,
      );

      const dataSourceAreaSetCode =
        "areaSetCode" in dataSource.geocodingConfig
          ? dataSource.geocodingConfig.areaSetCode
          : null;

      // Match type is only Exact if the provided area set is the same as the area set used by the data source
      // Otherwise, the records found here were geocoded as within the provided area
      let match =
        dataSourceAreaSetCode === input.areaSetCode
          ? DataRecordMatchType.Exact
          : DataRecordMatchType.Contains;

      // If some records are found, return them (as this will be all the records that match the provided area)
      if (records.length) {
        return { records, match };
      }

      // If no records were found, but the data source is geocoded by area,
      // it is possible to find an area that matches the data source and overlaps
      // with the input area, and then get records for that area instead.
      // E.G. If the input area is small (e.g. a Ward), but the data source
      // area is large (e.g. a Region), it is possible to find the Region
      // that contains the Ward, and then get the records for that Region.
      if (!dataSourceAreaSetCode) {
        // Data source not geocoded by area
        return { records, match };
      }

      // Update default match type
      match = DataRecordMatchType.Approximate;

      const inputArea = await findAreaByCode(input.areaCode, input.areaSetCode);
      if (!inputArea) {
        return { records, match };
      }

      let dataSourceArea = (
        await findAreasContaining({
          areaId: inputArea.id,
          includeAreaSetCode: dataSourceAreaSetCode,
        })
      )[0];
      if (dataSourceArea) {
        match = DataRecordMatchType.ContainedBy;
      }

      if (!dataSourceArea) {
        dataSourceArea = (
          await findAreasByPoint({
            point: geojsonPointToPoint(inputArea.samplePoint),
            includeAreaSetCode: dataSourceAreaSetCode,
          })
        )[0];
      }

      if (!dataSourceArea) {
        return { records, match };
      }

      records = await findDataRecordsByDataSourceAndAreaCode(
        input.dataSourceId,
        dataSourceArea.areaSetCode,
        dataSourceArea.code,
      );
      return {
        records,
        match: records.length ? match : DataRecordMatchType.None,
      };
    }),
  byPoint: dataSourceReadProcedure
    .input(
      z.object({
        point: pointSchema,
      }),
    )
    .query(async ({ input, ctx: { dataSource } }) => {
      const match = DataRecordMatchType.ContainedBy;
      const geocodingConfig = dataSource.geocodingConfig;
      if (!("areaSetCode" in geocodingConfig)) {
        return { records: [], match, area: null };
      }
      // Postcode polygons are proprietary and may not be present/licensed;
      // resolve the point's postcode via postcodes.io instead and match on
      // the code stored at geocode time (mirrors the geocoding fallback)
      if (
        geocodingConfig.areaSetCode === AreaSetCode.PC &&
        !getBooleanEnvVar("ENABLE_DATABASE_POSTCODE_LOOKUP")
      ) {
        const postcode = await reversePostcodeLookup(input.point);
        if (!postcode) {
          return { records: [], match, area: null };
        }
        const code = postcode.replace(/\s+/g, "").toUpperCase();
        const records = await findDataRecordsByDataSourceAndAreaCode(
          input.dataSourceId,
          AreaSetCode.PC,
          code,
        );
        return { records, match, area: { code, name: postcode } };
      }
      const areas = await findAreasByPoint({
        point: input.point,
        includeAreaSetCode: geocodingConfig.areaSetCode,
      });
      if (!areas.length) {
        return { records: [], match, area: null };
      }
      const records = await findDataRecordsByDataSourceAndAreaCode(
        input.dataSourceId,
        areas[0].areaSetCode,
        areas[0].code,
      );
      // The resolved area lets the client explain empty results
      // ("No records in PE25 3LS")
      return {
        records,
        match,
        area: { code: areas[0].code, name: areas[0].name },
      };
    }),
  list: dataSourceReadProcedure
    .input(
      z.object({
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        page: z.number().optional(),
        sort: z.array(recordSortSchema).optional(),
        all: z.boolean().optional(),
        timelineRange: timelineRangeSchema.optional(),
      }),
    )
    .query(
      async ({
        input: { dataSourceId, filter, search, page, sort, all, timelineRange },
      }) => {
        const records = await findDataRecordsByDataSource(
          dataSourceId,
          filter,
          search,
          page || 0,
          sort || [],
          all,
          timelineRange,
        );
        const count = await countDataRecordsForDataSource(
          dataSourceId,
          filter,
          search,
          timelineRange,
        );
        return { records, count };
      },
    ),
  columnStat: dataSourceReadProcedure
    .input(
      z.object({
        columnName: z.string(),
        stat: z.nativeEnum(InspectorComparisonStat),
      }),
    )
    .query(async ({ input }) => {
      return getColumnStat(input.dataSourceId, input.columnName, input.stat);
    }),
});
