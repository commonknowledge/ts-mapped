// Human friendly labels for enums

import { AreaSetCode, DataSourceType, GeocodingType } from "@/types";
import { AirtableConfig, CSVConfig, MailchimpConfig } from "./zod";

export const AreaSetCodeLabels: Record<AreaSetCode, string> = {
  PC: "UK Postcode",
  OA21: "Census Output Area (2021)",
  MSOA21: "Middle Super Output Area (2021)",
  WMC24: "Westminster Constituency (2024)",
};

type DataSourceConfigKey =
  | keyof AirtableConfig
  | keyof CSVConfig
  | keyof MailchimpConfig;

export const DataSourceConfigLabels: Record<DataSourceConfigKey, string> = {
  apiKey: "API Key",
  baseId: "Base ID",
  filename: "Filename",
  idColumn: "ID Column",
  listId: "List ID",
  tableId: "Table ID",
  type: "Type",
  serverPrefix: "Server Prefix",
};

export const DataSourceTypeLabels: Record<DataSourceType, string> = {
  airtable: "Airtable",
  csv: "CSV",
  mailchimp: "Mailchimp",
};

export const GeocodingTypeLabels: Record<GeocodingType | "postcode", string> = {
  address: 'Address, e.g. "113-115 Fonthill Road, N4 3HH"',
  code: 'Area code, e.g. "E14001305"',
  name: 'Area name, e.g. "Islington North"',
  postcode: "UK Postcode", // Front-end only
  none: "",
};
