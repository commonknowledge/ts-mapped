/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * "markerDataSourceIds" is required by mapConfigSchema, but maps created
 * before it existed (or inserted with the column default of "{}") have no
 * such key, which crashes the map editor. Backfill it to an empty array and
 * change the column default so new rows always carry it.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map
    SET config = jsonb_set(config, '{markerDataSourceIds}', '[]'::jsonb)
    WHERE NOT config ? 'markerDataSourceIds'
  `.execute(db);

  await sql`
    ALTER TABLE map
    ALTER COLUMN config SET DEFAULT '{"markerDataSourceIds": []}'::jsonb
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Backfilled rows are indistinguishable from real empty arrays, so only
  // the column default is restored.
  await sql`
    ALTER TABLE map
    ALTER COLUMN config SET DEFAULT '{}'::jsonb
  `.execute(db);
}
