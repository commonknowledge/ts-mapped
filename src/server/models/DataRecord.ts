import {
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { GeocodeResult, Point } from "@/types";

export interface DataRecordTable {
  id: Generated<string>;
  externalId: string;
  json: JSONColumnType<Record<string, unknown>>;
  geocodeResult: JSONColumnType<GeocodeResult | null>;
  geocodePoint: Point | null;
  dataSourceId: string;
}

export type DataRecord = Selectable<DataRecordTable>;
export type NewDataRecord = Insertable<DataRecordTable>;
export type DataRecordUpdate = Updateable<DataRecordTable>;
