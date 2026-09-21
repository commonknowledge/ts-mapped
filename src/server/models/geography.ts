import type { Expression } from "kysely";
import type { ColumnType } from "kysely";

/**
 * Insert/update type for a PostGIS geography column: an explicit SQL
 * expression (see `toGeography` in `@/server/services/database/geography`),
 * never a plain object. Nullable columns also accept `null`.
 */
export type GeographyValue<Read> = null extends Read
  ? Expression<string> | null
  : Expression<string>;

/**
 * A PostGIS geography column. Reads come back parsed by the PointPlugin
 * (e.g. `{ lat, lng }`); writes must go through `toGeography`, so that a
 * plain `{ lat, lng }` object can never be mistaken for geometry when it is
 * actually destined for a JSONB column.
 */
export type GeographyColumn<Read> = ColumnType<
  Read,
  GeographyValue<Read>,
  GeographyValue<Read>
>;
