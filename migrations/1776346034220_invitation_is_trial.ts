/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("invitation")
    .addColumn("isTrial", "boolean", (col) =>
      col.notNull().defaultTo(sql`false`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("invitation").dropColumn("isTrial").execute();
}
