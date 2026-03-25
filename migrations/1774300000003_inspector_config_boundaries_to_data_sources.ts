import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE map_view
    SET inspector_config = jsonb_set(
      inspector_config - 'boundaries',
      '{dataSources}',
      COALESCE(inspector_config->'boundaries', '[]'::jsonb)
    )
    WHERE inspector_config ? 'boundaries'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE map_view
    SET inspector_config = jsonb_set(
      inspector_config - 'dataSources',
      '{boundaries}',
      COALESCE(inspector_config->'dataSources', '[]'::jsonb)
    )
    WHERE inspector_config ? 'dataSources'
  `.execute(db);
}
