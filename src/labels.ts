// Human friendly labels for enums

import type {
  AreaSetCode,
  AreaSetGroupCode,
  DataSourceRecordType,
  EnrichmentSourceType,
  GeocodingType,
} from "./__generated__/types";
import type {
  actionNetworkConfigSchema,
  airtableConfigSchema,
  csvConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
} from "./server/models/DataSource";
import type { DataSourceType } from "@/server/models/DataSource";
import type z from "zod";

export const AreaSetCodeLabels: Record<AreaSetCode, string> = {
  PC: "UK Postcode",
  OA21: "Census Output Area (2021)",
  MSOA21: "Middle Super Output Area (2021)",
  WMC24: "Westminster Constituency (2024)",
};

export const AreaSetGroupCodeLabels: Record<AreaSetGroupCode, string> = {
  OA21: "Census Output Area (2021)",
  WMC24: "Westminster Constituency (2024)",
};

type DataSourceConfigKey =
  | keyof z.infer<typeof actionNetworkConfigSchema>
  | keyof z.infer<typeof airtableConfigSchema>
  | keyof z.infer<typeof googleSheetsConfigSchema>
  | keyof z.infer<typeof mailchimpConfigSchema>
  | keyof z.infer<typeof csvConfigSchema>;

export const DataSourceConfigLabels: Record<DataSourceConfigKey, string> = {
  apiKey: "API Key",
  baseId: "Base ID",
  listId: "List ID",
  oAuthCredentials: "OAuth Credentials",
  sheetName: "Sheet Name",
  spreadsheetId: "Spreadsheet ID",
  tableId: "Table ID",
  type: "Type",
  url: "URL",
  serverPrefix: "Server Prefix",
};

export const DataSourceTypeLabels: Record<DataSourceType, string> = {
  actionnetwork: "Action Network",
  airtable: "Airtable",
  csv: "CSV",
  googlesheets: "Google Sheets",
  mailchimp: "Mailchimp",
};

export const EnrichmentSourceTypeLabels: Record<EnrichmentSourceType, string> =
  {
    Area: "Geocoded area",
    DataSource: "Mapped data source",
  };

export const GeocodingTypeLabels: Record<GeocodingType | "Postcode", string> = {
  Address: 'Address, e.g. "113-115 Fonthill Road, N4 3HH"',
  Code: 'Area code, e.g. "E14001305"',
  Name: 'Area name, e.g. "Islington North"',
  Postcode: "UK Postcode", // Front-end only
  None: "Disabled",
};

export const DataSourceRecordTypeLabels: Record<DataSourceRecordType, string> =
  {
    Members: "Members",
    People: "People",
    Locations: "Locations",
    Events: "Events",
    Data: "Data",
    Other: "Other",
  };
