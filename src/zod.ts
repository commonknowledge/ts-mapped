import z from "zod";
import { AreaSetCode, DataSourceType, GeocodingType } from "./types";

export const AirtableConfigSchema = z.object({
  type: z.literal(DataSourceType.Airtable),
  apiKey: z.string().nonempty(),
  baseId: z.string().nonempty(),
  tableId: z.string().nonempty(),
});

export type AirtableConfig = z.infer<typeof AirtableConfigSchema>;

export const MailchimpConfigSchema = z.object({
  type: z.literal(DataSourceType.Mailchimp),
  apiKey: z.string().nonempty(),
  listId: z.string().nonempty(),
  serverPrefix: z.string().nonempty(),
});

export type MailchimpConfig = z.infer<typeof MailchimpConfigSchema>;

export const CSVConfigSchema = z.object({
  type: z.literal(DataSourceType.CSV),
  filename: z.string().nonempty(),
  idColumn: z.string().nonempty(),
});

export type CSVConfig = z.infer<typeof CSVConfigSchema>;

export const DataSourceConfigSchema = z.discriminatedUnion("type", [
  AirtableConfigSchema,
  MailchimpConfigSchema,
  CSVConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

const GeocodingOnAddressSchema = z.object({
  type: z.literal(GeocodingType.address),
  column: z.string().nonempty(),
});

const GeocodingOnAreaSetTypeSchema = z.enum([
  GeocodingType.name,
  GeocodingType.code,
]);
export const GeocodingOnAreaSetType = GeocodingOnAreaSetTypeSchema.Enum;

const GeocodingOnAreaSetSchema = z.object({
  type: GeocodingOnAreaSetTypeSchema,
  column: z.string().nonempty(),
  areaSetCode: z.nativeEnum(AreaSetCode),
});

const GeocodingDisabledSchema = z.object({
  type: z.literal(GeocodingType.none),
});

export const DataSourceGeocodingConfigSchema = z.discriminatedUnion("type", [
  GeocodingOnAddressSchema,
  GeocodingOnAreaSetSchema,
  GeocodingDisabledSchema,
]);

export type DataSourceGeocodingConfig = z.infer<
  typeof DataSourceGeocodingConfigSchema
>;
