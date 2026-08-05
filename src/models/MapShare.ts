import z from "zod";

// `passwordHash` is stripped from tRPC responses by the
// `hasPasswordHashSerializer` superjson custom serializer.
export const mapShareSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  token: z.string(),
  enabled: z.boolean(),
  passwordHash: z.string().nullable(),
  passwordUpdatedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type MapShare = z.infer<typeof mapShareSchema>;
