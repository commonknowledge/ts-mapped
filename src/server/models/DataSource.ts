import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { z } from "zod";
import { ColumnType } from "@/__generated__/types";

export type ColumnDefs = {
  name: string
  type: ColumnType
}[]

const AirtableConfigSchema = z.object({
  type: z.literal("airtable"),
  apiKey: z.string(),
  baseId: z.string(),
  tableId: z.string(),
});

const MailchimpConfigSchema = z.object({
  type: z.literal("mailchimp"),
  apiKey: z.string(),
  listId: z.string(),
  serverPrefix: z.string(),
});

const CSVConfigSchema = z.object({
  type: z.literal("csv"),
  filename: z.string(),
  idColumn: z.string(),
});

export const DataSourceConfigSchema = z.discriminatedUnion("type", [
  AirtableConfigSchema,
  MailchimpConfigSchema,
  CSVConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

export const DataSourceGeocodingConfigSchema = z.object({
  type: z.enum(["code", "name"]),
  column: z.string(),
  areaSetCode: z.string(),
});

export type DataSourceGeocodingConfig = z.infer<
  typeof DataSourceGeocodingConfigSchema
>;

export interface DataSourceTable {
  id: Generated<string>;
  name: string;
  columnDefs: JSONColumnType<ColumnDefs>;
  config: JSONColumnType<DataSourceConfig>;
  geocodingConfig: JSONColumnType<DataSourceGeocodingConfig>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type DataSource = Selectable<DataSourceTable>;
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
