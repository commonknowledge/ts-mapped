import z from "zod";

export enum MapAccessStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Revoked = "Revoked",
}

// A visitor's request to see a moderated public map or a shared private
// map, and its outcome. Exactly one of `publicMapId` and `mapShareId` is set.
export const mapAccessSchema = z.object({
  id: z.string(),
  publicMapId: z.string().nullable(),
  mapShareId: z.string().nullable(),
  email: z.string(),
  status: z.enum(MapAccessStatus),
  requestedFromUrl: z.string().nullable(),
  moderatorsNotifiedAt: z.date().nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type MapAccess = z.infer<typeof mapAccessSchema>;

// What an access row is for: a public map or a map share
export type MapAccessTargetRef =
  { kind: "publicMap"; id: string } | { kind: "mapShare"; id: string };

// A magic link issued to an approved visitor. Server-only: never sent to
// clients.
export const mapAccessTokenSchema = z.object({
  id: z.string(),
  mapAccessId: z.string(),
  tokenHash: z.string(),
  issuedAt: z.date(),
});

export type MapAccessToken = z.infer<typeof mapAccessTokenSchema>;
