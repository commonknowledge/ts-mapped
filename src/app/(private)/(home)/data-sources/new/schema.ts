import z from "zod";
import {
  DataSourceType,
  actionNetworkConfigSchema,
  airtableConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
} from "@/server/models/DataSource";

// Unsaved CSV config is quite different to saved config
export const newCSVConfigSchema = z.object({
  type: z.literal(DataSourceType.CSV),
  file: z.instanceof(File),
  filename: z.string().nonempty(),
});

export const newDataSourceConfigSchema = z.discriminatedUnion("type", [
  actionNetworkConfigSchema,
  airtableConfigSchema,
  mailchimpConfigSchema,
  googleSheetsConfigSchema,
  newCSVConfigSchema,
]);

export type NewDataSourceConfig = z.infer<typeof newDataSourceConfigSchema>;
