import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { MapConfig } from "@/__generated__/types";

export interface MapViewTable {
  id: Generated<string>;
  config: JSONColumnType<MapConfig>;
  organisationId: string;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type MapView = Selectable<MapViewTable>;
export type NewMapView = Insertable<MapViewTable>;
export type MapViewUpdate = Updateable<MapViewTable>;
