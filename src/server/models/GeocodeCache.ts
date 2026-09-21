import type { GeocodeContext } from "@/models/DataRecord";
import type { Point } from "@/models/shared";
import type { GeographyColumn } from "@/server/models/geography";
import type { ColumnType, Insertable } from "kysely";

export interface GeocodeCacheTable {
  address: string;
  point: GeographyColumn<Point | null>;
  context: GeocodeContext | null;
  createdAt: ColumnType<Date, Date | undefined, Date>;
}

export type NewGeocodeCache = Insertable<GeocodeCacheTable>;
