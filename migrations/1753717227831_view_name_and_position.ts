/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mapView")
    .addColumn("name", "text", (col) => col.notNull().defaultTo("Untitled"))
    .addColumn("position", sql`double precision`, (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mapView")
    .dropColumn("name")
    .dropColumn("position")
    .execute();
}
