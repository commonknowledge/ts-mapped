// Human friendly labels for enums

import type { AreaSetCode, AreaSetGroupCode } from "./server/models/AreaSet";
import type {
  DataSourceRecordType,
  EnrichmentSourceType,
  GeocodingType,
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
  WMC24: "Westminster Constituency (2024)",
  LAD25: "Local Authority District (2025)",
  W25: "Ward (2025)",
  LSOA21: "Lower Super Output Area (2021)",
  MSOA21: "Middle Super Output Area (2021)",
  OA21: "Census Output Area (2021)",
  CTYUA24: "County (2024)",
  CAUTH25: "Combined Authority (2025)",
  UKR18: "UK Region (2018)",
  UKC24: "UK Country (2024)",
  SPC22: "Scottish Parliament Constituency (2022)",
  SENC22: "Senedd Constituency (2022)",
};

export const AreaSetGroupCodeLabels: Record<AreaSetGroupCode, string> = {
  WMC24: "Westminster Constituency",
  CTYUA24: "County",
  LAD25: "Local Authority District",
  W25: "Local Authority District ➔ Ward",
  MSOA21: "MSOA ➔ Census Output Area",
  LSOA21: "MSOA ➔ LSOA ➔ Census Output Area",
  CAUTH25: "Combined Authority",
  UKR18: "UK Region",
  UKC24: "UK Country",
  SPC22: "Scottish Parliament Constituency",
  SENC22: "Senedd Constituency",
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
  Coordinates: "Latitude & Longitude coordinates",
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
