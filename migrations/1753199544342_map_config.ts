/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("map")
    .addColumn("config", "jsonb", (col) => col.notNull().defaultTo("{}"))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("map").execute();
}
