/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("publicMap").addColumn("draft", "jsonb").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("publicMap").dropColumn("draft").execute();
}
