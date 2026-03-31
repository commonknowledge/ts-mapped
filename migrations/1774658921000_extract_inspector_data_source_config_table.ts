/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create the new table
  await db.schema
    .createTable("inspector_data_source_config")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("map_view_id", "uuid", (col) =>
      col.notNull().references("map_view.id").onDelete("cascade"),
    )
    .addColumn("data_source_id", "uuid", (col) =>
      col.notNull().references("data_source.id").onDelete("cascade"),
    )
    .addColumn("name", "text")
    .addColumn("description", "text")
    .addColumn("icon", "text")
    .addColumn("screenshot_url", "text")
    .addColumn("layout", "text")
    .addColumn("color", "text")
    .addColumn("items", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("position", "double precision", (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  // Migrate data from mapView.inspectorConfig JSONB to the new table
  await sql`
    INSERT INTO inspector_data_source_config (
      id, map_view_id, data_source_id, name, description, icon,
      screenshot_url, layout, color, items, position
    )
    SELECT
      COALESCE((ds->>'id')::uuid, gen_random_uuid()),
      mv.id,
      (ds->>'dataSourceId')::uuid,
      ds->>'name',
      ds->>'description',
      ds->>'icon',
      ds->>'screenshotUrl',
      ds->>'layout',
      ds->>'color',
      COALESCE(ds->'items', '[]'::jsonb),
      (idx - 1)::double precision
    FROM map_view mv,
         jsonb_array_elements(mv.inspector_config->'dataSources') WITH ORDINALITY AS arr(ds, idx)
    INNER JOIN data_source ON data_source.id = (ds->>'dataSourceId')::uuid
    WHERE mv.inspector_config IS NOT NULL
      AND mv.inspector_config->'dataSources' IS NOT NULL
  `.execute(db);

  // Drop the inspectorConfig column from mapView
  await db.schema
    .alterTable("map_view")
    .dropColumn("inspector_config")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Re-add the inspectorConfig column
  await db.schema
    .alterTable("map_view")
    .addColumn("inspector_config", "jsonb")
    .execute();

  // Migrate data back from the table to the JSONB column
  await sql`
    UPDATE map_view mv
    SET inspector_config = jsonb_build_object(
      'dataSources',
      (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'dataSourceId', c.data_source_id,
            'name', c.name,
            'description', c.description,
            'icon', c.icon,
            'screenshotUrl', c.screenshot_url,
            'layout', c.layout,
            'color', c.color,
            'items', c.items
          ) ORDER BY c.position
        ), '[]'::jsonb)
        FROM inspector_data_source_config c
        WHERE c.map_view_id = mv.id
      )
    )
    WHERE EXISTS (
      SELECT 1 FROM inspector_data_source_config c WHERE c.map_view_id = mv.id
    )
  `.execute(db);

  // Drop the new table
  await db.schema.dropTable("inspector_data_source_config").execute();
}
