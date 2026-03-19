import type { PublicMap } from "@/models/PublicMap";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type PublicMapTable = PublicMap & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewPublicMap = Insertable<PublicMapTable>;
export type PublicMapUpdate = Updateable<PublicMapTable>;
