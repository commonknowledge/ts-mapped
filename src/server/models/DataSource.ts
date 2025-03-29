import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { ColumnType } from "@/__generated__/types";
import { DataSourceConfig, DataSourceGeocodingConfig } from "@/zod";

export type ColumnDefs = {
  name: string;
  type: ColumnType;
}[];

export interface DataSourceTable {
  id: Generated<string>;
  name: string;
  columnDefs: JSONColumnType<ColumnDefs>;
  config: JSONColumnType<DataSourceConfig>;
  geocodingConfig: JSONColumnType<DataSourceGeocodingConfig>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type DataSource = Selectable<DataSourceTable>;
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
