import type { DataRecord } from "@/models/DataRecord";
import type { Point } from "@/models/shared";
import type { GeographyColumn } from "@/server/models/geography";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type DataRecordTable = Omit<DataRecord, "geocodePoint"> & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  geocodePoint: GeographyColumn<Point | null>;
};
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;

/** A data record to upsert, with its point as a plain `{ lat, lng }`. */
export type NewDataRecordInput = Omit<NewDataRecord, "geocodePoint"> & {
  geocodePoint?: Point | null;
};
