/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addColumn("enrichmentConfig", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropColumn("enrichmentConfig")
    .execute();
}
