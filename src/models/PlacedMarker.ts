import z from "zod";
import { pointSchema } from "./shared";

export const placedMarkerSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  label: z.string(),
  notes: z.string(),
  point: pointSchema,
  folderId: z.string().nullish(),
  position: z.number(),
});

export type PlacedMarker = z.infer<typeof placedMarkerSchema>;
