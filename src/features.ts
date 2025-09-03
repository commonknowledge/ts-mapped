import { DataSourceType } from "./types";

export const DataSourceFeatures: Record<
  DataSourceType,
  { autoEnrich: boolean; autoImport: boolean; enrichment: boolean }
> = {
  [DataSourceType.actionnetwork]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
  [DataSourceType.airtable]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
  [DataSourceType.csv]: {
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
  },
  [DataSourceType.googlesheets]: {
    // TODO: update this when there is webhook batching
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
  },
  [DataSourceType.mailchimp]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
};
