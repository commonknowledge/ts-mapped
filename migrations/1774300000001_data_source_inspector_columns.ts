import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addColumn("inspectorColumns", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropColumn("inspectorColumns")
    .execute();
}
