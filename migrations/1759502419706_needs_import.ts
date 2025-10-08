/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataRecord")
    .addColumn("needsImport", "boolean", (col) =>
      col.defaultTo(false).notNull(),
    )
    .addColumn("needsEnrich", "boolean", (col) =>
      col.defaultTo(false).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataRecord")
    .dropColumn("needsImport")
    .dropColumn("needsEnrich")
    .execute();
}
