// Human friendly labels for enums

import { FilterType } from "@/models/MapView";
import type { AreaSetCode, AreaSetGroupCode } from "@/models/AreaSet";
import type {
  ColumnDisplayFormat,
  ColumnSemanticType,
  DataSourceRecordType,
  EnrichmentSourceType,
  GeocodingType,
  actionNetworkConfigSchema,
  airtableConfigSchema,
  csvConfigSchema,
  googleSheetsConfigSchema,
  mailchimpConfigSchema,
} from "@/models/DataSource";
import type { DataSourceType } from "@/models/DataSource";
import type { columnFilterTypes } from "@/models/MapView";
import type z from "zod";

export const AreaSetCodeLabels: Record<AreaSetCode, string> = {
  PC: "UK Postcode",
  WMC24: "Westminster Constituency",
  LAD25: "Local Authority District",
  W25: "Ward",
  LSOA21: "Lower Super Output Area",
  MSOA21: "Middle Super Output Area",
  OA21: "Census Output Area",
  CTYUA24: "County",
  CAUTH25: "Combined Authority",
  UKR18: "UK Region",
  UKC24: "UK Country",
  SPC22: "Scottish Parliament Constituency",
  SENC22: "Senedd Constituency",
  SOA22: "Scottish Output Area",
  SDZ22: "Scottish Data Zone",
  SIZ22: "Scottish Intermediate Zone",
  COED26: "Church of England Diocese",
};

export const AreaSetCodeYears: Record<AreaSetCode, string> = {
  PC: "",
  WMC24: "2024 &mdash; present",
  LAD25: "2025 &mdash; present",
  W25: "2025 &mdash; present",
  LSOA21: "2021 &mdash; present",
  MSOA21: "2021 &mdash; present",
  OA21: "2021 &mdash; present",
  CTYUA24: "2024 &mdash; present",
  CAUTH25: "2025 &mdash; present",
  UKR18: "2018 &mdash; present",
  UKC24: "2024 &mdash; present",
  SPC22: "2022 &mdash; present",
  SENC22: "2022 &mdash; present",
  SOA22: "2022 &mdash; present",
  SDZ22: "2022 &mdash; present",
  SIZ22: "2022 &mdash; present",
  COED26: "2026 &mdash; present",
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
  SOA22: "Scottish Inter. Zone ➔ Data Zone ➔ Output Area",
  COED26: "Church of England Diocese",
};

export const AreaSetGroupCodeYears: Record<AreaSetGroupCode, string> = {
  WMC24: "2024 &mdash; present",
  LAD25: "2025 &mdash; present",
  W25: "2025 &mdash; present",
  LSOA21: "2021 &mdash; present",
  MSOA21: "2021 &mdash; present",
  CTYUA24: "2024 &mdash; present",
  CAUTH25: "2025 &mdash; present",
  UKR18: "2018 &mdash; present",
  UKC24: "2024 &mdash; present",
  SPC22: "2022 &mdash; present",
  SENC22: "2022 &mdash; present",
  SOA22: "2022 &mdash; present",
  COED26: "2026 &mdash; present",
};

export const FilterTypeLabels: Record<
  (typeof columnFilterTypes)[number],
  string
> = {
  [FilterType.TEXT]: "contains",
  [FilterType.EXACT]: "is",
  [FilterType.EMPTY]: "is empty",
  [FilterType.NOT_EMPTY]: "is not empty",
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

export const ColumnSemanticTypeLabels: Record<ColumnSemanticType, string> = {
  Text: "Text",
  Number: "Number",
  Percentage01: "Percentage (0–1)",
  Percentage0100: "Percentage (0–100)",
};

export const ColumnDisplayFormatLabels: Record<ColumnDisplayFormat, string> = {
  Text: "Text",
  Number: "Number",
  Percentage: "Percentage (bar)",
  Scale: "Scale (bars)",
  NumberWithComparison: "Number with comparison",
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
