import type { PlacedMarker } from "@/models/PlacedMarker";
import type { Point } from "@/models/shared";
import type { GeographyColumn } from "@/server/models/geography";
import type { Generated, Insertable, Updateable } from "kysely";

export type PlacedMarkerTable = Omit<PlacedMarker, "point"> & {
  id: Generated<string>;
  point: GeographyColumn<Point>;
};
export type NewPlacedMarker = Insertable<PlacedMarkerTable>;
export type PlacedMarkerUpdate = Updateable<PlacedMarkerTable>;

/** A placed marker to upsert, with its point as a plain `{ lat, lng }`. */
export type NewPlacedMarkerInput = Omit<NewPlacedMarker, "point"> & {
  point: Point;
};
