/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("public_map")
    .renameColumn("colour_scheme", "color_scheme")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("public_map")
    .renameColumn("color_scheme", "colour_scheme")
    .execute();
}
