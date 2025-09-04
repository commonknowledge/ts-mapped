import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";
import z from "zod";
import { areaSetCode } from "./AreaSet";

export const dataSourceTypes = [
  "actionnetwork",
  "airtable",
  "csv",
  "googlesheets",
  "mailchimp",
] as const;

export enum DataSourceType {
  ActionNetwork = "actionnetwork",
  Airtable = "airtable",
  CSV = "csv",
  GoogleSheets = "googlesheets",
  Mailchimp = "mailchimp",
}
export const dataSourceType = z.nativeEnum(DataSourceType);

export const actionNetworkConfigSchema = z.object({
  apiKey: z.string().nonempty(),
  type: z.literal(DataSourceType.ActionNetwork),
});

export const airtableConfigSchema = z.object({
  type: z.literal(DataSourceType.Airtable),
  apiKey: z.string().nonempty(),
  baseId: z.string().nonempty(),
  tableId: z.string().nonempty(),
});

export const mailchimpConfigSchema = z.object({
  type: z.literal(DataSourceType.Mailchimp),
  apiKey: z.string().nonempty(),
  listId: z.string().nonempty(),
  serverPrefix: z.string().nonempty(),
});

export const googleOAuthCredentialsSchema = z.object({
  access_token: z.string().nonempty(),
  refresh_token: z.string().nonempty(),
  expiry_date: z.number().optional(),
});

export type GoogleOAuthCredentials = z.infer<
  typeof googleOAuthCredentialsSchema
>;

export const googleSheetsConfigSchema = z.object({
  type: z.literal(DataSourceType.GoogleSheets),
  spreadsheetId: z.string().nonempty(),
  sheetName: z.string().nonempty(),
  oAuthCredentials: googleOAuthCredentialsSchema,
});

export type GoogleSheetsConfig = z.infer<typeof googleSheetsConfigSchema>;

export const CSVConfigSchema = z.object({
  type: z.literal(DataSourceType.CSV),
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

// Unsaved CSV config is quite different to saved config
export const newCSVConfigSchema = z.object({
  type: z.literal(DataSourceType.CSV),
  file: z.instanceof(File),
  filename: z.string().nonempty(),
});

export type NewCSVConfig = z.infer<typeof newCSVConfigSchema>;

export const newDataSourceConfigSchema = z.discriminatedUnion("type", [
  actionNetworkConfigSchema,
  airtableConfigSchema,
  mailchimpConfigSchema,
  googleSheetsConfigSchema,
  newCSVConfigSchema,
]);

export type NewDataSourceConfig = z.infer<typeof newDataSourceConfigSchema>;

export const enrichmentSourceTypes = ["Area", "DataSource"] as const;

export enum EnrichmentSourceType {
  Area = "Area",
  DataSource = "DataSource",
}

export const enrichmentSourceType = z.nativeEnum(EnrichmentSourceType);

export const areaPropertyTypes = ["code", "name"] as const;

export enum AreaPropertyType {
  Code = "code",
  Name = "name",
}

const areaPropertyEnum = z.nativeEnum(AreaPropertyType);

const areaEnrichmentSchema = z.object({
  sourceType: z.literal(EnrichmentSourceType.Area),
  areaSetCode: areaSetCode,
  areaProperty: areaPropertyEnum,
});

export type AreaEnrichment = z.infer<typeof areaEnrichmentSchema>;

const dataSourceEnrichmentSchema = z.object({
  sourceType: z.literal(EnrichmentSourceType.DataSource),
  dataSourceId: z.string().nonempty(),
  dataSourceColumn: z.string().nonempty(),
});

export type DataSourceEnrichment = z.infer<typeof dataSourceEnrichmentSchema>;

export const enrichmentSchema = z.discriminatedUnion("sourceType", [
  areaEnrichmentSchema,
  dataSourceEnrichmentSchema,
]);

export type Enrichment = z.infer<typeof enrichmentSchema>;

export const geocodingTypes = ["Address", "Code", "Name", "None"] as const;

export enum GeocodingType {
  Address = "Address",
  Code = "Code",
  Name = "Name",
  None = "None",
}

export const geocodingType = z.nativeEnum(GeocodingType);

const addressGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Address),
  columns: z.array(z.string().nonempty()),
});

export type AddressGeocodingConfig = z.infer<typeof addressGeocodingSchema>;

const nameGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Name),
  column: z.string().nonempty(),
  areaSetCode: areaSetCode,
});

const codeGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Code),
  column: z.string().nonempty(),
  areaSetCode: areaSetCode,
});

const disabledGeocodingSchema = z.object({
  type: z.literal(GeocodingType.None),
});

export const AreaGeocodingType = z.enum([
  GeocodingType.Code,
  GeocodingType.Name,
]);

export const areaConfigSchema = z.discriminatedUnion("type", [
  nameGeocodingSchema,
  codeGeocodingSchema,
]);

export type AreaGeocodingConfig = z.infer<typeof areaConfigSchema>;

export const geocodingConfigSchema = z.discriminatedUnion("type", [
  addressGeocodingSchema,
  nameGeocodingSchema,
  codeGeocodingSchema,
  disabledGeocodingSchema,
]);

export type GeocodingConfig = z.infer<typeof geocodingConfigSchema>;

export const columnTypes = [
  "Boolean",
  "Empty",
  "Number",
  "Object",
  "String",
  "Unknown",
] as const;

export enum ColumnType {
  Boolean = "Boolean",
  Empty = "Empty",
  Number = "Number",
  Object = "Object",
  String = "String",
  Unknown = "Unknown",
}

export const columnType = z.nativeEnum(ColumnType);

export const columnDefSchema = z.object({
  name: z.string(),
  type: columnType,
});

export const columnRolesSchema = z.object({
  nameColumns: z.array(z.string()),
});

export const dataSourceRecordTypes = [
  "Members",
  "People",
  "Locations",
  "Events",
  "Data",
  "Other",
] as const;

export enum DataSourceRecordType {
  Members = "Members",
  People = "People",
  Locations = "Locations",
  Events = "Events",
  Data = "Data",
  Other = "Other",
}

export const dataSourceRecordType = z.nativeEnum(DataSourceRecordType);

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  autoEnrich: z.boolean(),
  autoImport: z.boolean(),
  recordType: dataSourceRecordType,
  config: dataSourceConfigSchema,
  columnDefs: z.array(columnDefSchema),
  columnRoles: columnRolesSchema,
  enrichments: z.array(enrichmentSchema),
  geocodingConfig: geocodingConfigSchema,
  organisationId: z.string(),
  public: z.boolean(),
  createdAt: z.date(),
});

export type DataSource = z.infer<typeof dataSourceSchema>;

export type DataSourceTable = DataSource & {
  id: Generated<string>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
};

export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
