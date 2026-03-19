import type { MapView } from "@/models/MapView";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type MapViewTable = MapView & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMapView = Insertable<MapViewTable>;
export type MapViewUpdate = Updateable<MapViewTable>;
