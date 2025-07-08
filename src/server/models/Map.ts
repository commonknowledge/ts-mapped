import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";

export interface MapTable {
  id: Generated<string>;
  name: string;
  organisationId: string;
  imageUrl: string | null;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type Map = Selectable<MapTable>;
export type NewMap = Insertable<MapTable>;
export type MapUpdate = Updateable<MapTable>;
