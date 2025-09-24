import z from "zod";
import type {
  ColumnType,
  GeneratedAlways,
  Insertable,
  Updateable,
} from "kysely";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .trim();

export const userSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  email: z.string().email().trim().toLowerCase(),
  name: z.string().trim(),
  avatarUrl: z.string().url().trim().nullish(),
  passwordHash: z.string(),
});

export type User = z.infer<typeof userSchema>;

export type UserTable = User & {
  id: GeneratedAlways<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
