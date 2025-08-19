import {
  Generated,
  Insertable,
  JSONColumnType,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { MapConfig } from "@/__generated__/types";

export interface MapTable {
  id: Generated<string>;
  name: string;
  organisationId: string;
  imageUrl: string | null;
  config: JSONColumnType<MapConfig>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
  dataSources: Generated<string[]>;
}

export type Map = Selectable<MapTable>;
export type NewMap = Insertable<MapTable>;
export type MapUpdate = Updateable<MapTable>;
