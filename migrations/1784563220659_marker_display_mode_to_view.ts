/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Move the marker display mode (clustering option) from the map config
 * ("markerDisplayModes") into each view's marker visualisation config
 * ("markerVisualisations"->ds_id->'displayMode'), where every other per-view
 * marker display choice already lives. Every existing view of a map inherits
 * the map-level mode; views diverge independently from then on.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      COALESCE(mv.config->'markerVisualisations', '{}'::jsonb) || (
        SELECT jsonb_object_agg(
          modes.ds_id,
          COALESCE(mv.config->'markerVisualisations'->modes.ds_id, '{}'::jsonb)
            || jsonb_build_object('displayMode', modes.mode)
        )
        FROM map m,
        LATERAL jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
        WHERE m.id = mv.map_id
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM map m,
      LATERAL jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
      WHERE m.id = mv.map_id
    )
  `.execute(db);

  await sql`
    UPDATE map
    SET config = config - 'markerDisplayModes'
    WHERE config ? 'markerDisplayModes'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Best effort: views may have diverged since the up migration; where they
  // have, an arbitrary view's mode wins as the restored map-level mode
  await sql`
    UPDATE map m
    SET config = jsonb_set(
      m.config,
      '{markerDisplayModes}',
      (
        SELECT jsonb_object_agg(vis.ds_id, vis.vis_config->'displayMode')
        FROM map_view mv,
        LATERAL jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
        WHERE mv.map_id = m.id AND vis.vis_config ? 'displayMode'
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM map_view mv,
      LATERAL jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE mv.map_id = m.id AND vis.vis_config ? 'displayMode'
    )
  `.execute(db);

  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      (
        SELECT jsonb_object_agg(vis.ds_id, vis.vis_config - 'displayMode')
        FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE vis.vis_config ? 'displayMode'
    )
  `.execute(db);
}
