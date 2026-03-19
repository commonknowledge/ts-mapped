import { z } from "zod";

export const organisationSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  avatarUrl: z.string().url().trim().nullish(),
  createdAt: z.date(),
});

export type Organisation = z.infer<typeof organisationSchema>;
