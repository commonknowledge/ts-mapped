import type { Map } from "@/models/Map";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type MapTable = Map & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMap = Insertable<MapTable>;
export type MapUpdate = Updateable<MapTable>;
