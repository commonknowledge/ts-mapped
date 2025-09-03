import z from "zod";
import { BaseTable, baseTableSchema } from "./BaseTable";

export const userSchema = baseTableSchema.extend({
  email: z.string().email(),
  passwordHash: z.string(),
});

export type User = z.infer<typeof userSchema>;

export interface UserTable extends BaseTable, Omit<User, "id" | "createdAt"> {}
