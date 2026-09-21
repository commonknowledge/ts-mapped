import type { DataRecord } from "@/models/DataRecord";
import type { Point } from "@/models/shared";
import type { GeographyColumn } from "@/server/models/geography";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type DataRecordTable = Omit<DataRecord, "geocodePoint"> & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  geocodePoint: GeographyColumn<Point | null>;
};

// Repositories take the point as a plain `{ lat, lng }` and convert it with
// `toGeography` themselves, so callers never build the SQL expression.
export type NewDataRecord = Omit<
  Insertable<DataRecordTable>,
  "geocodePoint"
> & {
  geocodePoint?: Point | null;
};
export type DataRecordUpdate = Omit<
  Updateable<DataRecordTable>,
  "geocodePoint"
> & {
  geocodePoint?: Point | null;
};
