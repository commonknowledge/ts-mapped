/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("folder").addColumn("color", "text").execute();
  await db.schema
    .alterTable("placedMarker")
    .addColumn("color", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("folder").dropColumn("color").execute();
  await db.schema.alterTable("placedMarker").dropColumn("color").execute();
}
