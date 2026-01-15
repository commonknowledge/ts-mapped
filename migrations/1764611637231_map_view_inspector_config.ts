/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("map_view")
    .addColumn("inspector_config", "jsonb")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("map_view")
    .dropColumn("inspector_config")
    .execute();
}
