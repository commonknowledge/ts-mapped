import z from "zod";
import {
  actionNetworkConfigSchema,
  airtableConfigSchema,
  csvConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
  zetkinConfigSchema,
} from "@/models/DataSource";

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
  zetkinConfigSchema,
]);

export type NewDataSourceConfig = z.infer<typeof newDataSourceConfigSchema>;
