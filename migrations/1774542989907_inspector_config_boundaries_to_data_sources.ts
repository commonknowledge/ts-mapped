/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view
    SET inspector_config = (inspector_config - 'boundaries') || jsonb_build_object('dataSources', inspector_config->'boundaries')
    WHERE inspector_config ? 'boundaries'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view
    SET inspector_config = (inspector_config - 'dataSources') || jsonb_build_object('boundaries', inspector_config->'dataSources')
    WHERE inspector_config ? 'dataSources'
  `.execute(db);
}
