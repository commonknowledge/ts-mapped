import z from "zod";
import { AreaSetCode } from "./AreaSet";
import type {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";

export enum JobStatus {
  None = "None",
  Failed = "Failed",
  Running = "Running",
  Complete = "Complete",
  Pending = "Pending",
}

export enum DataSourceType {
  ActionNetwork = "actionnetwork",
  Airtable = "airtable",
  CSV = "csv",
  GoogleSheets = "googlesheets",
  Mailchimp = "mailchimp",
}

export const dataSourceTypes = Object.values(DataSourceType);

export const actionNetworkConfigSchema = z.object({
  apiKey: z.string().nonempty(),
  type: z.literal(DataSourceType.ActionNetwork),
});

export type ActionNetworkConfig = z.infer<typeof actionNetworkConfigSchema>;

export const airtableConfigSchema = z.object({
  type: z.literal(DataSourceType.Airtable),
  apiKey: z.string().nonempty(),
  baseId: z.string().nonempty(),
  tableId: z.string().nonempty(),
});

export type AirtableConfig = z.infer<typeof airtableConfigSchema>;

export const mailchimpConfigSchema = z.object({
  type: z.literal(DataSourceType.Mailchimp),
  apiKey: z.string().nonempty(),
  listId: z.string().nonempty(),
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
  type: z.literal(DataSourceType.GoogleSheets),
  spreadsheetId: z.string().nonempty(),
  sheetName: z.string().nonempty(),
  oAuthCredentials: googleOAuthCredentialsSchema,
});

export type GoogleSheetsConfig = z.infer<typeof googleSheetsConfigSchema>;

export const csvConfigSchema = z.object({
  type: z.literal(DataSourceType.CSV),
  url: z.string().nonempty(),
});

export type CSVConfig = z.infer<typeof csvConfigSchema>;

export const dataSourceConfigSchema = z.discriminatedUnion("type", [
  actionNetworkConfigSchema,
  airtableConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
  csvConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof dataSourceConfigSchema>;

export enum EnrichmentSourceType {
  Area = "Area",
  DataSource = "DataSource",
}

export const enrichmentSourceTypes = Object.values(EnrichmentSourceType);

export enum AreaPropertyType {
  Code = "code",
  Name = "name",
}

export const areaPropertyTypes = Object.values(AreaPropertyType);

const areaEnrichmentSchema = z.object({
  sourceType: z.literal(EnrichmentSourceType.Area),
  areaSetCode: z.nativeEnum(AreaSetCode),
  areaProperty: z.nativeEnum(AreaPropertyType),
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

export enum GeocodingType {
  Address = "Address",
  Code = "Code",
  Name = "Name",
  None = "None",
}

export const geocodingTypes = Object.values(GeocodingType);

const addressGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Address),
  columns: z.array(z.string().nonempty()),
});

export type AddressGeocodingConfig = z.infer<typeof addressGeocodingSchema>;

const nameGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Name),
  column: z.string().nonempty(),
  areaSetCode: z.nativeEnum(AreaSetCode),
});

const codeGeocodingSchema = z.object({
  type: z.literal(GeocodingType.Code),
  column: z.string().nonempty(),
  areaSetCode: z.nativeEnum(AreaSetCode),
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

export enum ColumnType {
  Boolean = "Boolean",
  Empty = "Empty",
  Number = "Number",
  Object = "Object",
  String = "String",
  Unknown = "Unknown",
}
export const columnTypes = Object.values(ColumnType);

export const columnDefSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(ColumnType),
});

export const columnRolesSchema = z.object({
  nameColumns: z.array(z.string()),
});

export enum DataSourceRecordType {
  Members = "Members",
  People = "People",
  Locations = "Locations",
  Events = "Events",
  Data = "Data",
  Other = "Other",
}

export const dataSourceRecordTypes = Object.values(DataSourceRecordType);

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  autoEnrich: z.boolean(),
  autoImport: z.boolean(),
  recordType: z.nativeEnum(DataSourceRecordType, {
    errorMap: () => ({ message: "Valid record type is required" }),
  }),
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
