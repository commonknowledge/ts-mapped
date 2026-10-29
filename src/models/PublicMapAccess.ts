import z from "zod";

export enum PublicMapAccessStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Revoked = "Revoked",
}

// A visitor's request to see a moderated public map, and its outcome.
// `tokenHash` is never sent to clients.
export const publicMapAccessSchema = z.object({
  id: z.string(),
  publicMapId: z.string(),
  email: z.string(),
  status: z.enum(PublicMapAccessStatus),
  tokenHash: z.string().nullable(),
  tokenIssuedAt: z.date().nullable(),
  requestedFromUrl: z.string().nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type PublicMapAccess = z.infer<typeof publicMapAccessSchema>;
