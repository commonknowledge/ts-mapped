import { Polygon } from "geojson";
import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface TurfTable {
  id: Generated<string>;
  label: string;
  notes: string;
  area: number;
  polygon: Polygon;
  createdAt: Date;
  mapId: string;
}

export type Turf = Selectable<TurfTable>;
export type NewTurf = Insertable<TurfTable>;
export type TurfUpdate = Updateable<TurfTable>;
