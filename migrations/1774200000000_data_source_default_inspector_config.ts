import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addColumn("defaultInspectorConfig", "jsonb", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropColumn("defaultInspectorConfig")
    .execute();
}
