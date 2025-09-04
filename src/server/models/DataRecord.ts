import { Generated, Insertable, Updateable } from "kysely";
import { ColumnType } from "kysely";
import z from "zod";
import { geocodeResultSchema, jsonSchema, pointSchema } from "./shared";

export const dataRecordSchema = z.object({
  id: z.number(),
  externalId: z.string(),
  dataSourceId: z.string(),
  json: jsonSchema,
  geocodeResult: geocodeResultSchema.nullable(),
  geocodePoint: pointSchema.nullable(),
  createdAt: z.date(),
});

export type DataRecord = z.infer<typeof dataRecordSchema>;

export type DataRecordTable = DataRecord & {
  id: Generated<number>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;
