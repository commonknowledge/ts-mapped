/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataRecord")
    .addColumn("mappedJson", "jsonb", (col) => col.notNull().defaultTo("{}"))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("dataRecord").dropColumn("mappedJson").execute();
}
