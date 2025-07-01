import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { MapViewConfig } from "@/__generated__/types";

export interface MapViewTable {
  id: Generated<string>;
  config: JSONColumnType<MapViewConfig>;
  mapId: string;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type MapView = Selectable<MapViewTable>;
export type NewMapView = Insertable<MapViewTable>;
export type MapViewUpdate = Updateable<MapViewTable>;
