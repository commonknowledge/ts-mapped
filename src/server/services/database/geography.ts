import { sql } from "kysely";
import type { Point } from "@/models/shared";
import type { RawBuilder } from "kysely";

/**
 * Build the SQL expression for writing a `{ lat, lng }` point to a PostGIS
 * geography column. Geometry is never inferred from a value's shape (a data
 * record's JSON can legitimately contain `lat` and `lng` keys), so every
 * geography write goes through this helper.
 */
export function toGeography(point: Point): RawBuilder<string>;
export function toGeography(
  point: Point | null | undefined,
): RawBuilder<string> | null;
export function toGeography(
  point: Point | null | undefined,
): RawBuilder<string> | null {
  if (!point) {
    return null;
  }
  return sql<string>`ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)::geography`;
}
