import z from "zod";
import { DataSourceType } from "@/types";
import {
  AirtableConfig,
  AirtableConfigSchema,
  MailchimpConfig,
  MailchimpConfigSchema,
} from "@/zod";

// Unsaved CSV config is quite different to saved config
export const NewCSVConfigSchema = z.object({
  type: z.literal(DataSourceType.csv),
  file: z.instanceof(File),
  filename: z.string().nonempty(),
  idColumn: z.string().nonempty(),
});

export type NewCSVConfig = z.infer<typeof NewCSVConfigSchema>;

export const NewDataSourceConfigSchema = z.discriminatedUnion("type", [
  AirtableConfigSchema,
  MailchimpConfigSchema,
  NewCSVConfigSchema,
]);

export type NewDataSourceConfig =
  | AirtableConfig
  | MailchimpConfig
  | NewCSVConfig
  | { type: "" }; // Initial state
