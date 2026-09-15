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
  email: z.email().trim().toLowerCase(),
  name: z.string().trim(),
  avatarUrl: z.url().trim().nullish(),
  passwordHash: z.string(),
  role: z.enum(UserRole).nullish(),
  trialEndsAt: z.date().nullish(),
});

export type User = z.infer<typeof userSchema>;
