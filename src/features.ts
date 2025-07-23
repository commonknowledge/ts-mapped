import { DataSourceType } from "./types";

export const DataSourceFeatures: Record<
  DataSourceType,
  { autoEnrich: boolean; autoImport: boolean; enrichment: boolean }
> = {
  [DataSourceType.airtable]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: true,
  },
  [DataSourceType.csv]: {
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
  },
  [DataSourceType.googlesheets]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: true,
  },
  [DataSourceType.mailchimp]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: true,
  },
};
