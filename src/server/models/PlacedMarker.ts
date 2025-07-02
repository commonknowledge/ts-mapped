import { Generated, Insertable, Selectable, Updateable } from "kysely";
import { Point } from "@/types";

export interface PlacedMarkerTable {
  id: Generated<string>;
  label: string;
  mapId: string;
  notes: string;
  point: Point;
}

export type PlacedMarker = Selectable<PlacedMarkerTable>;
export type NewPlacedMarker = Insertable<PlacedMarkerTable>;
export type PlacedMarkerUpdate = Updateable<PlacedMarkerTable>;
