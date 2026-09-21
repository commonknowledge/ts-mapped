import type { PlacedMarker } from "@/models/PlacedMarker";
import type { Point } from "@/models/shared";
import type { GeographyColumn } from "@/server/models/geography";
import type { Generated, Insertable, Updateable } from "kysely";

export type PlacedMarkerTable = Omit<PlacedMarker, "point"> & {
  id: Generated<string>;
  point: GeographyColumn<Point>;
};

// Repositories take the point as a plain `{ lat, lng }` and convert it with
// `toGeography` themselves, so callers never build the SQL expression.
export type NewPlacedMarker = Omit<Insertable<PlacedMarkerTable>, "point"> & {
  point: Point;
};
export type PlacedMarkerUpdate = Omit<
  Updateable<PlacedMarkerTable>,
  "point"
> & {
  point?: Point;
};
