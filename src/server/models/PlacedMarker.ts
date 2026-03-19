import type { PlacedMarker } from "@/models/PlacedMarker";
import type { Generated, Insertable, Updateable } from "kysely";

export type PlacedMarkerTable = PlacedMarker & {
  id: Generated<string>;
};
export type NewPlacedMarker = Insertable<PlacedMarkerTable>;
export type PlacedMarkerUpdate = Updateable<PlacedMarkerTable>;
