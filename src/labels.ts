// Human friendly labels for enums

import { DataSourceType } from "@/types";
import {
  AreaSetCode,
  EnrichmentSourceType,
  GeocodingType,
} from "./__generated__/types";
import {
  AirtableConfig,
  CSVConfig,
  GoogleSheetsConfig,
  MailchimpConfig,
} from "./zod";

export const AreaSetCodeLabels: Record<AreaSetCode, string> = {
  PC: "UK Postcode",
  OA21: "Census Output Area (2021)",
  MSOA21: "Middle Super Output Area (2021)",
  WMC24: "Westminster Constituency (2024)",
};

type DataSourceConfigKey =
  | keyof AirtableConfig
  | keyof CSVConfig
  | keyof GoogleSheetsConfig
  | keyof MailchimpConfig;

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
