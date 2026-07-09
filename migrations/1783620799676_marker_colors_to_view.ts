/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Move marker layer colours from the map config to each of the map's view
 * configs, so marker styling is configured per view (like the choropleth).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view mv
    SET config = mv.config || jsonb_build_object('markerColors', m.config->'markerColors')
    FROM map m
    WHERE mv.map_id = m.id AND m.config ? 'markerColors'
  `.execute(db);

  await sql`
    UPDATE map
    SET config = config - 'markerColors'
    WHERE config ? 'markerColors'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Best effort: views of one map may have diverged since the up migration,
  // so restore the map-level colours from each map's first view by position.
  await sql`
    UPDATE map m
    SET config = m.config || jsonb_build_object('markerColors', v.config->'markerColors')
    FROM (
      SELECT DISTINCT ON (map_id) map_id, config
      FROM map_view
      WHERE config ? 'markerColors'
      ORDER BY map_id, position
    ) v
    WHERE m.id = v.map_id
  `.execute(db);

  await sql`
    UPDATE map_view
    SET config = config - 'markerColors'
    WHERE config ? 'markerColors'
  `.execute(db);
}
