/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Remove the unused "display" array from marker visualisation legend config.
 * The encoding picker it was reserved for was never built — the marker
 * legend always shows every enabled encoding.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      (
        SELECT jsonb_object_agg(
          vis.ds_id,
          CASE WHEN vis.vis_config ? 'legend'
            THEN jsonb_set(vis.vis_config, '{legend}', (vis.vis_config->'legend') - 'display')
            ELSE vis.vis_config
          END
        )
        FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE vis.vis_config->'legend' ? 'display'
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore the field as the empty array the UI always wrote
  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      (
        SELECT jsonb_object_agg(
          vis.ds_id,
          CASE WHEN vis.vis_config ? 'legend'
            THEN jsonb_set(vis.vis_config, '{legend,display}', '[]'::jsonb)
            ELSE vis.vis_config
          END
        )
        FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE vis.vis_config ? 'legend'
    )
  `.execute(db);
}
