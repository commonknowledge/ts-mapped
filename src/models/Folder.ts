import z from "zod";

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string(),
  position: z.number(),
  mapId: z.string(),
  hideMarkers: z.boolean().nullish(),
  type: z.enum(["placedMarker", "turf"]).default("placedMarker"),
});

export type Folder = z.infer<typeof folderSchema>;
