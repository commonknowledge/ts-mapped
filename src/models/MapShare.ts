import z from "zod";

// A private map shared read-only with people outside the organisation.
// Visitors request access by email, as on a moderated public map: the
// moderators approve them (see MapAccess).
export const mapShareSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  token: z.string(),
  enabled: z.boolean(),
  moderatorEmails: z.array(z.email()),
  createdAt: z.date(),
});

export type MapShare = z.infer<typeof mapShareSchema>;
