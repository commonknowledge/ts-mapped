import { JSONColumnType } from "kysely";
import z from "zod";
import { type TableOf, baseTableSchema } from "./base";

export const dataSourceTypeSchema = z.enum([
  "actionnetwork",
  "airtable",
  "csv",
  "googlesheets",
  "mailchimp",
]);

export const actionNetworkConfigSchema = z.object({
  apiKey: z.string().nonempty(),
  type: z.literal(dataSourceTypeSchema.Enum.actionnetwork),
});

export type ActionNetworkConfig = z.infer<typeof actionNetworkConfigSchema>;

export const airtableConfigSchema = z.object({
  type: z.literal(dataSourceTypeSchema.Enum.airtable),
  apiKey: z.string().nonempty(),
  baseId: z.string().nonempty(),
  tableId: z.string().nonempty(),
});

export type AirtableConfig = z.infer<typeof airtableConfigSchema>;

export const mailchimpConfigSchema = z.object({
  type: z.literal(dataSourceTypeSchema.Enum.mailchimp),
  apiKey: z.string().nonempty(),
  listId: z.string().nonempty(),
  serverPrefix: z.string().nonempty(),
});

export type MailchimpConfig = z.infer<typeof mailchimpConfigSchema>;

export const googleOAuthCredentialsSchema = z.object({
  access_token: z.string().nonempty(),
  refresh_token: z.string().nonempty(),
  expiry_date: z.number().optional(),
});

export type GoogleOAuthCredentials = z.infer<
  typeof googleOAuthCredentialsSchema
>;

export const googleSheetsConfigSchema = z.object({
  type: z.literal(dataSourceTypeSchema.Enum.googlesheets),
  spreadsheetId: z.string().nonempty(),
  sheetName: z.string().nonempty(),
  oAuthCredentials: googleOAuthCredentialsSchema,
});

export type GoogleSheetsConfig = z.infer<typeof googleSheetsConfigSchema>;

export const CSVConfigSchema = z.object({
  type: z.literal(dataSourceTypeSchema.Enum.csv),
  url: z.string().nonempty(),
});

export type CSVConfig = z.infer<typeof CSVConfigSchema>;

export const dataSourceConfigSchema = z.discriminatedUnion("type", [
  actionNetworkConfigSchema,
  airtableConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
  CSVConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof dataSourceConfigSchema>;

export const enrichmentSourceTypeSchema = z.enum(["Area", "DataSource"]);

export const areaSetCodeEnum = z.enum(["MSOA21", "OA21", "PC", "WMC24"]);

const areaEnrichmentSchema = z.object({
  sourceType: z.literal(enrichmentSourceTypeSchema.Enum.Area),
  areaSetCode: areaSetCodeEnum,
  areaProperty: z.enum(["code", "name"]),
});
export type AreaEnrichment = z.infer<typeof areaEnrichmentSchema>;

const dataSourceEnrichmentSchema = z.object({
  sourceType: z.literal(enrichmentSourceTypeSchema.Enum.DataSource),
  dataSourceId: z.string().nonempty(),
  dataSourceColumn: z.string().nonempty(),
});

export type DataSourceEnrichment = z.infer<typeof dataSourceEnrichmentSchema>;

export const enrichmentSchema = z.discriminatedUnion("sourceType", [
  areaEnrichmentSchema,
  dataSourceEnrichmentSchema,
]);

export type Enrichment = z.infer<typeof enrichmentSchema>;

export const geocodingTypeEnum = z.enum(["Address", "Code", "Name", "None"]);

const addressGeocodingSchema = z.object({
  type: z.literal(geocodingTypeEnum.Enum.Address),
  columns: z.array(z.string().nonempty()),
});

export type AddressGeocoding = z.infer<typeof addressGeocodingSchema>;

const areaGeocodingTypeEnum = z.enum([
  geocodingTypeEnum.Enum.Name,
  geocodingTypeEnum.Enum.Code,
]);
export const AreaGeocodingType = areaGeocodingTypeEnum.Enum;

const areaGeocodingSchema = z.object({
  type: areaGeocodingTypeEnum,
  column: z.string().nonempty(),
  areaSetCode: areaSetCodeEnum,
});

export type AreaGeocoding = z.infer<typeof areaGeocodingSchema>;

const disabledGeocodingSchema = z.object({
  type: z.literal(geocodingTypeEnum.Enum.None),
});

export const geocodingConfigSchema = z.discriminatedUnion("type", [
  addressGeocodingSchema,
  areaGeocodingSchema,
  disabledGeocodingSchema,
]);

export type GeocodingConfig = z.infer<typeof geocodingConfigSchema>;

export const columnTypeEnum = z.enum([
  "Boolean",
  "Empty",
  "Number",
  "Object",
  "String",
  "Unknown",
]);

export const columnDefSchema = z.object({
  name: z.string(),
  type: columnTypeEnum,
});

export type ColumnDef = z.infer<typeof columnDefSchema>;

export const columnRolesSchema = z.object({
  nameColumns: z.array(z.string()),
});

export type ColumnRoles = z.infer<typeof columnRolesSchema>;

export const dataSourceSchema = baseTableSchema({
  name: z.string(),
  autoEnrich: z.boolean(),
  autoImport: z.boolean(),
  config: dataSourceConfigSchema,
  columnDefs: z.array(columnDefSchema),
  columnRoles: columnRolesSchema,
  enrichments: z.array(enrichmentSchema),
  geocodingConfig: geocodingConfigSchema,
  organisationId: z.string(),
  public: z.boolean(),
});

export type DataSource = z.infer<typeof dataSourceSchema>;

export type DataSourceTable = TableOf<
  typeof dataSourceSchema,
  {
    config: JSONColumnType<DataSourceConfig>;
    columnDefs: JSONColumnType<ColumnDef[]>;
    columnRoles: JSONColumnType<ColumnRoles>;
    enrichments: JSONColumnType<Enrichment[]>;
    geocodingConfig: JSONColumnType<GeocodingConfig>;
  }
>;
