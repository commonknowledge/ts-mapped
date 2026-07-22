/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Remove the "Severity" and "Category" inspector display formats. They were
 * never column display types — they duplicated marker visualisation styling
 * (value colours), which the inspector now decodes directly on the columns
 * that drive it. Stored items fall back to the default text display.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE inspector_data_source_config
    SET items = (
      SELECT jsonb_agg(
        CASE WHEN item->>'displayFormat' IN ('Severity', 'Category')
          THEN item - 'displayFormat'
          ELSE item
        END
      )
      FROM jsonb_array_elements(items) AS item
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements(items) AS item
      WHERE item->>'displayFormat' IN ('Severity', 'Category')
    )
  `.execute(db);

  await sql`
    UPDATE data_source
    SET default_inspector_config = jsonb_set(
      default_inspector_config,
      '{items}',
      (
        SELECT jsonb_agg(
          CASE WHEN item->>'displayFormat' IN ('Severity', 'Category')
            THEN item - 'displayFormat'
            ELSE item
          END
        )
        FROM jsonb_array_elements(default_inspector_config->'items') AS item
      )
    )
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(default_inspector_config->'items') AS item
      WHERE item->>'displayFormat' IN ('Severity', 'Category')
    )
  `.execute(db);
}

export async function down(): Promise<void> {
  // Irreversible: the removed formats are dropped from the stored items,
  // and which columns used which format is not recorded anywhere else
}
