import z from "zod";
import { pointSchema } from "./shared";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export const placedMarkerSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  label: z.string(),
  notes: z.string(),
  address: z.string().nullish(),
  point: pointSchema,
  folderId: z.string().nullish(),
  position: z.number(),
});

export type PlacedMarker = z.infer<typeof placedMarkerSchema>;
export type PlacedMarkerTable = PlacedMarker & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewPlacedMarker = Insertable<PlacedMarkerTable>;
export type PlacedMarkerUpdate = Updateable<PlacedMarkerTable>;
