import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE map_view
    SET config = jsonb_set(
      config - 'categoryColors',
      '{colorMappings}',
      COALESCE(config->'categoryColors', '{}'::jsonb)
    )
    WHERE config ? 'categoryColors'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE map_view
    SET config = jsonb_set(
      config - 'colorMappings',
      '{categoryColors}',
      COALESCE(config->'colorMappings', '{}'::jsonb)
    )
    WHERE config ? 'colorMappings'
  `.execute(db);
}
