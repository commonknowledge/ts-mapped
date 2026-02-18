import z from "zod";
import {
  DataSourceRecordType,
  DataSourceType,
  actionNetworkConfigSchema,
  airtableConfigSchema,
  csvConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
  payloadCMSConfigSchema,
} from "@/server/models/DataSource";

export const newCSVConfigSchema = csvConfigSchema.extend({
  file: z.instanceof(File),
  filename: z.string().min(1, "Filename is required"),
});

export type NewCSVConfig = z.infer<typeof newCSVConfigSchema>;

export const newDataSourceConfigSchema = z.discriminatedUnion("type", [
  actionNetworkConfigSchema,
  airtableConfigSchema,
  mailchimpConfigSchema,
  googleSheetsConfigSchema,
  newCSVConfigSchema,
  payloadCMSConfigSchema,
]);

export type NewDataSourceConfig = z.infer<typeof newDataSourceConfigSchema>;

export const defaultStateSchema = z
  .object({
    dataSourceName: z.string().optional(),
    recordType: z.nativeEnum(DataSourceRecordType).optional(),
    dataSourceType: z.nativeEnum(DataSourceType).optional(),
  })
  .catch({
    dataSourceName: undefined,
    recordType: undefined,
    dataSourceType: undefined,
  });

export type DefaultState = z.infer<typeof defaultStateSchema>;
