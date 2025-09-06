import { DataSourceType } from "./server/models/DataSource";

export const DataSourceFeatures: Record<
  DataSourceType,
  { autoEnrich: boolean; autoImport: boolean; enrichment: boolean }
> = {
  [DataSourceType.ActionNetwork]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
  [DataSourceType.Airtable]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
  [DataSourceType.CSV]: {
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
  },
  [DataSourceType.GoogleSheets]: {
    // TODO: update this when there is webhook batching
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
  },
  [DataSourceType.Mailchimp]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
  },
};
