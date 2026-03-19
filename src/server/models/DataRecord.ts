import type { DataRecord } from "@/models/DataRecord";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type DataRecordTable = DataRecord & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;
