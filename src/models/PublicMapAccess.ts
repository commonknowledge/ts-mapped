import z from "zod";

export enum PublicMapAccessStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Revoked = "Revoked",
}

// A visitor's request to see a moderated public map, and its outcome.
export const publicMapAccessSchema = z.object({
  id: z.string(),
  publicMapId: z.string(),
  email: z.string(),
  status: z.enum(PublicMapAccessStatus),
  requestedFromUrl: z.string().nullable(),
  moderatorsNotifiedAt: z.date().nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type PublicMapAccess = z.infer<typeof publicMapAccessSchema>;

// A magic link issued to an approved visitor. Server-only: never sent to
// clients.
export const publicMapAccessTokenSchema = z.object({
  id: z.string(),
  publicMapAccessId: z.string(),
  tokenHash: z.string(),
  issuedAt: z.date(),
});

export type PublicMapAccessToken = z.infer<typeof publicMapAccessTokenSchema>;
