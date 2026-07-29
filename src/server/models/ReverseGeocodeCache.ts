import type { GeocodeContext } from "@/models/DataRecord";
import type { ColumnType, Insertable } from "kysely";

export interface ReverseGeocodeCacheTable {
  key: string;
  context: GeocodeContext | null;
  createdAt: ColumnType<Date, Date | undefined, Date>;
}

export type NewReverseGeocodeCache = Insertable<ReverseGeocodeCacheTable>;
