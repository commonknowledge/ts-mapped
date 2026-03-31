/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addColumn("defaultInspectorConfig", "jsonb")
    .addColumn("defaultChoroplethConfig", "jsonb")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropColumn("defaultInspectorConfig")
    .dropColumn("defaultChoroplethConfig")
    .execute();
}
