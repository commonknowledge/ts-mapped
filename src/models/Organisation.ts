import { z } from "zod";

export enum Feature {
  PublicMaps = "PublicMaps",
  Enrichment = "Enrichment",
  MovementDataLibrary = "MovementDataLibrary",
  InviteUsers = "InviteUsers",
  SyncToCrm = "SyncToCrm",
}

export const featureSchema = z.nativeEnum(Feature);

export const organisationSchema = z.object({
  id: z.string(),
  name: z.string().trim(),
  avatarUrl: z.string().url().trim().nullish(),
  features: z.array(featureSchema).default([]),
  createdAt: z.date(),
});

export type Organisation = z.infer<typeof organisationSchema>;
