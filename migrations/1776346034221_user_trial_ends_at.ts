/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addColumn("trial_ends_at", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("user").dropColumn("trial_ends_at").execute();
}
