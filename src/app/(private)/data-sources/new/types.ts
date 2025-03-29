import { AirtableConfig, CSVConfig, MailchimpConfig } from "@/zod";

// Extended DataSourceConfig to add client-side properties
export type NewCSVConfig = CSVConfig & { file: File | null };
export type NewDataSourceConfig =
  | AirtableConfig
  | MailchimpConfig
  | NewCSVConfig
  | { type: "" };
