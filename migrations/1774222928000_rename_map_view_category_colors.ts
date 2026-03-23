/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "mapView"
    SET config = jsonb_set(config - 'categoryColors', '{colorMappings}', config->'categoryColors')
    WHERE config ? 'categoryColors'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "mapView"
    SET config = jsonb_set(config - 'colorMappings', '{categoryColors}', config->'colorMappings')
    WHERE config ? 'colorMappings'
  `.execute(db);
}
