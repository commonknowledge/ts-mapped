import z from "zod";
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
});

export type User = z.infer<typeof userSchema>;
