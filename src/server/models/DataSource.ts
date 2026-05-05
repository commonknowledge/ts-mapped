import type { DataSource } from "@/models/DataSource";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type DataSourceTable = DataSource & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  adminApproved: Generated<boolean>;
  dateFormat: Generated<string>;
  recordCount: Generated<number>;
};
export type NewDataSource = Insertable<DataSourceTable>;
export type DataSourceUpdate = Updateable<DataSourceTable>;
