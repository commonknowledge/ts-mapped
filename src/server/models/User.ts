import type { User } from "@/models/User";
import type {
  ColumnType,
  GeneratedAlways,
  Insertable,
  Updateable,
} from "kysely";

export type UserTable = User & {
  id: GeneratedAlways<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
