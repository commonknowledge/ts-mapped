import z from "zod";
import { type TableOf, baseTableSchema } from "./base";

export const userSchema = baseTableSchema({
  email: z.string().email(),
  passwordHash: z.string(),
});

export type User = z.infer<typeof userSchema>;

export type UserTable = TableOf<typeof userSchema>;
