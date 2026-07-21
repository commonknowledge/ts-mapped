import z from "zod";
import { pointSchema } from "./shared";
import type { ColumnDef } from "./DataSource";
import type { ExternalRecord } from "@/types";

export interface EnrichedRecord {
  externalRecord: ExternalRecord;
  columns: {
    def: ColumnDef;
    value: unknown;
  }[];
}

const geocodeResultSchema = z.object({
  areas: z.record(z.string(), z.string()),
  centralPoint: pointSchema.nullable(),
  samplePoint: pointSchema.nullable(),
});

export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

export const dataRecordSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  dataSourceId: z.string(),
  json: z.record(z.string(), z.unknown()),
  geocodeResult: geocodeResultSchema.nullable(),
  geocodePoint: pointSchema.nullable(),
  // The record's date, parsed at import from the data source's date column
  // role and date format; null when there is no date column or the value
  // doesn't parse
  date: z.date().nullable(),
  needsEnrich: z.boolean().optional(),
  needsImport: z.boolean().optional(),
  createdAt: z.date(),
});

export type DataRecord = z.infer<typeof dataRecordSchema>;
