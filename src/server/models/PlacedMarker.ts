import { ColumnType, Generated, Insertable, Updateable } from "kysely";
import z from "zod";
import { pointSchema } from "./shared";

export const placedMarkerSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  label: z.string(),
  notes: z.string(),
  point: pointSchema,
  folderId: z.string().nullable(),
  position: z.number(),
});

export type PlacedMarker = z.infer<typeof placedMarkerSchema>;
export type PlacedMarkerTable = PlacedMarker & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewPlacedMarker = Insertable<PlacedMarkerTable>;
export type PlacedMarkerUpdate = Updateable<PlacedMarkerTable>;
