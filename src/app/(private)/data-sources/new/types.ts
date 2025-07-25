import z from "zod";
import { DataSourceType } from "@/types";
import {
  ActionNetworkConfigSchema,
  AirtableConfigSchema,
  GoogleSheetsConfigSchema,
  MailchimpConfigSchema,
} from "@/zod";

// Unsaved CSV config is quite different to saved config
export const NewCSVConfigSchema = z.object({
  type: z.literal(DataSourceType.csv),
  file: z.instanceof(File),
  filename: z.string().nonempty(),
});

export type NewCSVConfig = z.infer<typeof NewCSVConfigSchema>;

export const NewDataSourceConfigSchema = z.discriminatedUnion("type", [
  ActionNetworkConfigSchema,
  AirtableConfigSchema,
  MailchimpConfigSchema,
  GoogleSheetsConfigSchema,
  NewCSVConfigSchema,
]);

export type NewDataSourceConfig = z.infer<typeof NewDataSourceConfigSchema>;
