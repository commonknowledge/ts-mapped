import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetCode } from "@/server/models/AreaSet";
import { recordFilterSchema, recordSortSchema } from "@/server/models/MapView";
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
} from "@/server/repositories/DataRecord";
import { DataRecordMatchType } from "@/types";
import { dataSourceReadProcedure, router } from "../index";

export const dataRecordRouter = router({
  findPageIndex: dataSourceReadProcedure
    .input(
      z.object({
        dataRecordId: z.string(),
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        sort: z.array(recordSortSchema).optional(),
      }),
    )
    .query(({ input: { dataRecordId, dataSourceId, filter, search, sort } }) =>
      findPageForDataRecord(
        dataRecordId,
        dataSourceId,
        filter,
        search,
        sort || [],
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
            point: inputArea.samplePoint,
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
      return { records, match };
    }),
  list: dataSourceReadProcedure
    .input(
      z.object({
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        page: z.number().optional(),
        sort: z.array(recordSortSchema).optional(),
        all: z.boolean().optional(),
      }),
    )
    .query(
      async ({ input: { dataSourceId, filter, search, page, sort, all } }) => {
        const records = await findDataRecordsByDataSource(
          dataSourceId,
          filter,
          search,
          page || 0,
          sort || [],
          all,
        );
        const count = await countDataRecordsForDataSource(
          dataSourceId,
          filter,
          search,
        );
        return { records, count };
      },
    ),
});
