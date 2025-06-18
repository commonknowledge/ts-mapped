import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { ColumnDef, ColumnRoles } from "@/__generated__/types";
import { DataSourceType } from "@/types";
import { DataSourceConfig, Enrichment, GeocodingConfig } from "@/zod";

export interface DataSourceTable {
  id: Generated<string>;
  name: string;
  autoEnrich: boolean;
  autoImport: boolean;
  config: JSONColumnType<DataSourceConfig>;
  columnDefs: JSONColumnType<ColumnDef[]>;
  columnRoles: JSONColumnType<ColumnRoles>;
  enrichments: JSONColumnType<Enrichment[]>;
  geocodingConfig: JSONColumnType<GeocodingConfig>;
  organisationId: string;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type DataSource = Selectable<DataSourceTable>;
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;

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
  [DataSourceType.mailchimp]: {
    autoEnrich: true,
    autoImport: true,
    enrichment: true,
  },
};
