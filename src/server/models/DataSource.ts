import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { ColumnDef, ColumnRoles } from "@/__generated__/types";
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
  public: boolean;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type DataSource = Selectable<DataSourceTable>;
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
