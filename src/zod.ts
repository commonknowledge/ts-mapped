// All zod schemas.
// Should probably only import from ./types and __generated__ here.
// If adding a new discriminated union with an associated GraphQL type,
// update src/app/api/graphql/typeDefs/checks.ts with compile-time equivalence checks.

import z from "zod";
import {
  AreaSetCode,
  EnrichmentSourceType,
  GeocodingType,
} from "./__generated__/types";
import { DataSourceType } from "./types";

export const ActionNetworkConfigSchema = z.object({
  apiKey: z.string().nonempty(),
  type: z.literal(DataSourceType.actionnetwork),
});

export type ActionNetworkConfig = z.infer<typeof ActionNetworkConfigSchema>;

export const AirtableConfigSchema = z.object({
  type: z.literal(DataSourceType.airtable),
  apiKey: z.string().nonempty(),
  baseId: z.string().nonempty(),
  tableId: z.string().nonempty(),
});

export type AirtableConfig = z.infer<typeof AirtableConfigSchema>;

export const MailchimpConfigSchema = z.object({
  type: z.literal(DataSourceType.mailchimp),
  apiKey: z.string().nonempty(),
  listId: z.string().nonempty(),
  serverPrefix: z.string().nonempty(),
});

export type MailchimpConfig = z.infer<typeof MailchimpConfigSchema>;

export const GoogleOAuthCredentialsSchema = z.object({
  access_token: z.string().nonempty(),
  refresh_token: z.string().nonempty(),
  expiry_date: z.number().optional(),
});

export type GoogleOAuthCredentials = z.infer<
  typeof GoogleOAuthCredentialsSchema
>;

export const GoogleSheetsConfigSchema = z.object({
  type: z.literal(DataSourceType.googlesheets),
  spreadsheetId: z.string().nonempty(),
  sheetName: z.string().nonempty(),
  oAuthCredentials: GoogleOAuthCredentialsSchema,
});

export type GoogleSheetsConfig = z.infer<typeof GoogleSheetsConfigSchema>;

export const CSVConfigSchema = z.object({
  type: z.literal(DataSourceType.csv),
  url: z.string().nonempty(),
});

export type CSVConfig = z.infer<typeof CSVConfigSchema>;

export const DataSourceConfigSchema = z.discriminatedUnion("type", [
  ActionNetworkConfigSchema,
  AirtableConfigSchema,
  GoogleSheetsConfigSchema,
  MailchimpConfigSchema,
  CSVConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

const AreaEnrichmentSchema = z.object({
  sourceType: z.literal(EnrichmentSourceType.Area),
  areaSetCode: z.nativeEnum(AreaSetCode),
  areaProperty: z.enum(["code", "name"]),
});

export type AreaEnrichment = z.infer<typeof AreaEnrichmentSchema>;

const DataSourceEnrichmentSchema = z.object({
  sourceType: z.literal(EnrichmentSourceType.DataSource),
  dataSourceId: z.string().nonempty(),
  dataSourceColumn: z.string().nonempty(),
});

export type DataSourceEnrichment = z.infer<typeof DataSourceEnrichmentSchema>;

export const EnrichmentSchema = z.discriminatedUnion("sourceType", [
  AreaEnrichmentSchema,
  DataSourceEnrichmentSchema,
]);

export type Enrichment = z.infer<typeof EnrichmentSchema>;

const AddressGeocodingConfigSchema = z.object({
  type: z.literal(GeocodingType.Address),
  columns: z.array(z.string().nonempty()),
});

export type AddressGeocodingConfig = z.infer<
  typeof AddressGeocodingConfigSchema
>;

const AreaGeocodingTypeSchema = z.enum([
  GeocodingType.Name,
  GeocodingType.Code,
]);
export const AreaGeocodingType = AreaGeocodingTypeSchema.Enum;

const AreaGeocodingSchema = z.object({
  type: AreaGeocodingTypeSchema,
  column: z.string().nonempty(),
  areaSetCode: z.nativeEnum(AreaSetCode),
});

export type AreaGeocodingConfig = z.infer<typeof AreaGeocodingSchema>;

const DisabledGeocodingSchema = z.object({
  type: z.literal(GeocodingType.None),
});

export const GeocodingConfigSchema = z.discriminatedUnion("type", [
  AddressGeocodingConfigSchema,
  AreaGeocodingSchema,
  DisabledGeocodingSchema,
]);

export type GeocodingConfig = z.infer<typeof GeocodingConfigSchema>;
