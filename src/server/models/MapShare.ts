import type { MapShare } from "@/models/MapShare";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type MapShareTable = MapShare & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMapShare = Insertable<MapShareTable>;
export type MapShareUpdate = Updateable<MapShareTable>;
