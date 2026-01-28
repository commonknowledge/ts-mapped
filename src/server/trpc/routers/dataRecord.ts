import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetCode } from "@/server/models/AreaSet";
import { recordFilterSchema, recordSortSchema } from "@/server/models/MapView";
import {
  countDataRecordsForDataSource,
  findDataRecordById,
  findDataRecordsByDataSource,
  findDataRecordsByDataSourceAndAreaCode,
  findPageForDataRecord,
} from "@/server/repositories/DataRecord";
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
    .query(({ input }) => {
      return findDataRecordsByDataSourceAndAreaCode(
        input.dataSourceId,
        input.areaSetCode,
        input.areaCode,
      );
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
