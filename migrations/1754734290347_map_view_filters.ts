/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mapView")
    .addColumn("dataSourceViews", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("mapView").dropColumn("dataSourceViews").execute();
}
