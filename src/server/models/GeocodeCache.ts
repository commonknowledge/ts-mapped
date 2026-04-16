import type { Point } from "@/models/shared";
import type { ColumnType, Insertable } from "kysely";

export interface GeocodeCacheTable {
  address: string;
  point: Point | null;
  createdAt: ColumnType<Date, Date | undefined, Date>;
}

export type NewGeocodeCache = Insertable<GeocodeCacheTable>;
