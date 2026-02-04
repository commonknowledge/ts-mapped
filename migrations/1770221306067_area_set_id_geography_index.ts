/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`.execute(db);
  await sql`CREATE INDEX area_area_set_id_geography_gist ON area USING GIST (area_set_id, geography)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS area_area_set_id_geography_gist`.execute(db);
  await sql`DROP EXTENSION IF EXISTS btree_gist`.execute(db);
}
