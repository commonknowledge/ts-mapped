import z from "zod";
import { geocodeResultSchema, pointSchema } from "./shared";
import type { ColumnDef } from "./DataSource";
import type { ExternalRecord } from "@/types";
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
