import z from "zod";
import { pointSchema } from "./shared";
import type { ColumnDef } from "./DataSource";
import type { ExternalRecord } from "@/types";

/** Column values to write onto a record in the external source system.
 *  Producers include the enrichment pipeline and the inspector's notes. */
export interface ExternalRecordUpdate {
  externalRecord: ExternalRecord;
  columns: {
    def: ColumnDef;
    value: unknown;
  }[];
}

const geocodeContextEntrySchema = z
  .object({ name: z.string().optional() })
  .passthrough();

/** Mapbox v6 geocoding `properties.context`: a map of layer name
 *  (e.g. "place", "region", "postcode") to that layer's details. */
export const geocodeContextSchema = z.record(
  z.string(),
  geocodeContextEntrySchema,
);

export type GeocodeContext = z.infer<typeof geocodeContextSchema>;

const geocodeResultSchema = z.object({
  areas: z.record(z.string(), z.string()),
  centralPoint: pointSchema.nullable(),
  samplePoint: pointSchema.nullable(),
  // Raw Mapbox context captured at forward-geocode time (address sources).
  // Absent for records geocoded another way; the Geocode enrichment
  // reverse-geocodes from the point to fill the gap on demand.
  geocodeContext: geocodeContextSchema.nullish(),
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
