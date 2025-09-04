import { Generated, Insertable, Updateable } from "kysely";
import { ColumnType } from "kysely";
import z from "zod";
import { geocodeResultSchema, pointSchema } from "./shared";

export const dataRecordSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  dataSourceId: z.string(),
  json: z.record(z.string(), z.unknown()),
  geocodeResult: geocodeResultSchema.nullable(),
  geocodePoint: pointSchema.nullable(),
  createdAt: z.date(),
});

export type DataRecord = z.infer<typeof dataRecordSchema>;

export type DataRecordTable = DataRecord & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;
