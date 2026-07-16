/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Fold the per-view "clusteringEnabled" marker switch into the map-level
 * marker display mode. Markers that were displayed unclustered (mode
 * "clusters" with clusteringEnabled=false in any view) become the new "none"
 * display mode, and the clusteringEnabled key is removed from view configs.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map m
    SET config = jsonb_set(
      m.config,
      '{markerDisplayModes}',
      COALESCE(m.config->'markerDisplayModes', '{}'::jsonb) || v.modes
    )
    FROM (
      SELECT mv.map_id, jsonb_object_agg(vis.ds_id, '"none"'::jsonb) AS modes
      FROM map_view mv
      JOIN map m2 ON m2.id = mv.map_id,
      LATERAL jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE mv.config ? 'markerVisualisations'
        AND vis.vis_config->>'clusteringEnabled' = 'false'
        AND COALESCE(m2.config->'markerDisplayModes'->>vis.ds_id, 'clusters') = 'clusters'
      GROUP BY mv.map_id
    ) v
    WHERE m.id = v.map_id
  `.execute(db);

  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      (
        SELECT jsonb_object_agg(vis.ds_id, vis.vis_config - 'clusteringEnabled')
        FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each(mv.config->'markerVisualisations') AS vis(ds_id, vis_config)
      WHERE vis.vis_config ? 'clusteringEnabled'
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore clusteringEnabled=false in every view of maps using the "none"
  // display mode, merging into any existing per-source visualisation config
  await sql`
    UPDATE map_view mv
    SET config = jsonb_set(
      mv.config,
      '{markerVisualisations}',
      (
        SELECT COALESCE(mv.config->'markerVisualisations', '{}'::jsonb) || jsonb_object_agg(
          modes.ds_id,
          COALESCE(mv.config->'markerVisualisations'->modes.ds_id, '{}'::jsonb)
            || jsonb_build_object('clusteringEnabled', false)
        )
        FROM map m, LATERAL jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
        WHERE m.id = mv.map_id AND modes.mode = 'none'
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM map m, LATERAL jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
      WHERE m.id = mv.map_id AND modes.mode = 'none'
    )
  `.execute(db);

  await sql`
    UPDATE map m
    SET config = jsonb_set(
      m.config,
      '{markerDisplayModes}',
      (
        SELECT jsonb_object_agg(
          modes.ds_id,
          CASE WHEN modes.mode = 'none' THEN '"clusters"'::jsonb ELSE to_jsonb(modes.mode) END
        )
        FROM jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each_text(m.config->'markerDisplayModes') AS modes(ds_id, mode)
      WHERE modes.mode = 'none'
    )
  `.execute(db);
}
