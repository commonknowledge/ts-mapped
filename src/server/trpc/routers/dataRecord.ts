import z from "zod";
import { recordFilterSchema, recordSortSchema } from "@/server/models/MapView";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
  findPageForDataRecord,
} from "@/server/repositories/DataRecord";
import { db } from "@/server/services/database";
import { dataSourceReadProcedure, router } from "../index";

export const dataRecordRouter = router({
  findPage: dataSourceReadProcedure
    .input(
      z.object({
        dataRecordId: z.string(),
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        sort: z.array(recordSortSchema).optional(),
      }),
    )
    .query(
      async ({
        input: { dataRecordId, dataSourceId, filter, search, sort },
      }) => {
        const page = await findPageForDataRecord(
          dataRecordId,
          dataSourceId,
          filter,
          search,
          sort || [],
        );
        return page || 0;
      },
    ),

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

  byId: dataSourceReadProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ input: { recordId, dataSourceId } }) => {
      const record = await db
        .selectFrom("dataRecord")
        .where("id", "=", recordId)
        .where("dataSourceId", "=", dataSourceId)
        .selectAll()
        .executeTakeFirst();

      if (!record) {
        throw new Error("Record not found");
      }

      return record;
    }),
});
