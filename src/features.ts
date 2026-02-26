import { DataSourceType } from "./server/models/DataSource";

export const DataSourceFeatures: Record<
  DataSourceType,
  {
    autoEnrich: boolean;
    autoImport: boolean;
    enrichment: boolean;
    syncToCrm: boolean;
  }
> = {
  [DataSourceType.ActionNetwork]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
    syncToCrm: true,
  },
  [DataSourceType.Airtable]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
    syncToCrm: true,
  },
  [DataSourceType.CSV]: {
    autoEnrich: false,
    autoImport: false,
    enrichment: false,
    syncToCrm: false,
  },
  [DataSourceType.GoogleSheets]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
    syncToCrm: true,
  },
  [DataSourceType.Mailchimp]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: false,
    syncToCrm: true,
  },
};
