import type { PublicMapAccess } from "@/models/PublicMapAccess";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type PublicMapAccessTable = PublicMapAccess & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewPublicMapAccess = Insertable<PublicMapAccessTable>;
export type PublicMapAccessUpdate = Updateable<PublicMapAccessTable>;
