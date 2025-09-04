import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Selectable,
  Updateable,
} from "kysely";
import z from "zod";

export interface UserTable {
  id: Generated<string>;
  email: string;
  passwordHash: string;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  createdAt: z.date(),
});
