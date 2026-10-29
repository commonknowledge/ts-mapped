import type {
  PublicMapAccess,
  PublicMapAccessToken,
} from "@/models/PublicMapAccess";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export type PublicMapAccessTable = PublicMapAccess & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewPublicMapAccess = Insertable<PublicMapAccessTable>;
export type PublicMapAccessUpdate = Updateable<PublicMapAccessTable>;

export type PublicMapAccessTokenTable = PublicMapAccessToken & {
  id: Generated<string>;
  issuedAt: Generated<Date>;
};
export type NewPublicMapAccessToken = Insertable<PublicMapAccessTokenTable>;
