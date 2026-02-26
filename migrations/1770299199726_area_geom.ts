/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

/**
 * Add a generated `area.geom` column that is the `geometry` version
 * of the source `geography` column. At the time of writing, this column
 * is only used for one query (repositories/Area.ts/findAreasByPoint), as
 * it is *slightly* less accurate to use geometry columns when working with
 * geographical data, so should be avoided. However, this function is the
 * bottleneck when geocoding data records, and using geometry leads to a
 * 10x speedup, so the accuracy/performance tradeoff works out.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE area 
    ADD COLUMN geom geometry(MultiPolygon, 4326) NOT NULL
    GENERATED ALWAYS AS (geography::geometry) STORED
  `.execute(db);

  await sql`CREATE INDEX area_area_set_id_geom_gist ON area USING GIST (area_set_id, geom)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE area DROP COLUMN geom`.execute(db);
  await sql`DROP INDEX IF EXISTS area_area_set_id_geom_gist`.execute(db);
}
