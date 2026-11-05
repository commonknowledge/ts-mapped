import { z } from "zod";

export enum Feature {
  PublicMaps = "PublicMaps",
  Enrichment = "Enrichment",
  InviteUsers = "InviteUsers",
  SharedMaps = "SharedMaps",
  SyncToCrm = "SyncToCrm",
}

export const featureSchema = z.enum(Feature);

export const organisationSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  avatarUrl: z.url().trim().nullish(),
  features: z.array(featureSchema).default([]),
  createdAt: z.date(),
});

export type Organisation = z.infer<typeof organisationSchema>;
