import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { ColumnDef, ColumnsConfig } from "@/__generated__/types";
import { DataSourceConfig, DataSourceGeocodingConfig } from "@/zod";

export interface DataSourceTable {
  id: Generated<string>;
  name: string;
  columnDefs: JSONColumnType<ColumnDef[]>;
  config: JSONColumnType<DataSourceConfig>;
  columnsConfig: JSONColumnType<ColumnsConfig>;
  geocodingConfig: JSONColumnType<DataSourceGeocodingConfig>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type DataSource = Selectable<DataSourceTable>;
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
