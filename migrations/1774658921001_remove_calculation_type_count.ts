/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Migrate map views: set areaDataColumn to "__count" and set calculationType to "Avg"
  // for views that had calculationType = "Count"
  await sql`
    UPDATE "map_view"
    SET config = jsonb_set(
      jsonb_set(config, '{areaDataColumn}', '"__count"'),
      '{calculationType}',
      '"Avg"'
    )
    WHERE config->>'calculationType' = 'Count'
  `.execute(db);

  // Ensure all map views have a calculationType (default to "Avg" if missing)
  await sql`
    UPDATE "map_view"
    SET config = jsonb_set(config, '{calculationType}', '"Avg"')
    WHERE config->>'calculationType' IS NULL
  `.execute(db);

  // Migrate data sources: update default_choropleth_config where calculationType = "Count"
  await sql`
    UPDATE "data_source"
    SET "default_choropleth_config" = jsonb_set(
      jsonb_set(
        "default_choropleth_config",
        '{column}',
        '"__count"'
      ),
      '{calculationType}',
      '"Avg"'
    )
    WHERE "default_choropleth_config"->>'calculationType' = 'Count'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore calculationType = "Count" for map views with areaDataColumn = "__count"
  await sql`
    UPDATE "map_view"
    SET config = jsonb_set(
      config,
      '{calculationType}',
      '"Count"'
    )
    WHERE config->>'areaDataColumn' = '__count'
  `.execute(db);

  // Restore data source default_choropleth_config
  await sql`
    UPDATE "data_source"
    SET "default_choropleth_config" = jsonb_set(
      "default_choropleth_config",
      '{calculationType}',
      '"Count"'
    )
    WHERE "default_choropleth_config"->>'column' = '__count'
  `.execute(db);
}
