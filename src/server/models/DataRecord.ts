import z from "zod";
import { geocodeResultSchema, pointSchema } from "./shared";
import type { ColumnDef } from "./DataSource";
import type { ExternalRecord } from "@/types";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export interface EnrichedRecord {
  externalRecord: ExternalRecord;
  columns: {
    def: ColumnDef;
    value: unknown;
  }[];
}

export const dataRecordSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  dataSourceId: z.string(),
  json: z.record(z.string(), z.unknown()),
  geocodeResult: geocodeResultSchema.nullable(),
  geocodePoint: pointSchema.nullable(),
  needsEnrich: z.boolean().optional(),
  needsImport: z.boolean().optional(),
  createdAt: z.date(),
});

export type DataRecord = z.infer<typeof dataRecordSchema>;

export type DataRecordTable = DataRecord & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;
