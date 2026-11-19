import type { MapAccess, MapAccessToken } from "@/models/MapAccess";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type MapAccessTable = MapAccess & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMapAccess = Insertable<MapAccessTable>;
export type MapAccessUpdate = Updateable<MapAccessTable>;

export type MapAccessTokenTable = MapAccessToken & {
  id: Generated<string>;
  issuedAt: Generated<Date>;
};
export type NewMapAccessToken = Insertable<MapAccessTokenTable>;
