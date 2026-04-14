import z from "zod";

export enum UserRole {
  Advocate = "Advocate",
  Superadmin = "Superadmin",
}

export const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters");

export const userSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  email: z.string().email().trim().toLowerCase(),
  name: z.string().trim(),
  avatarUrl: z.string().url().trim().nullish(),
  passwordHash: z.string(),
  role: z.nativeEnum(UserRole).nullish(),
});

export type User = z.infer<typeof userSchema>;
