/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addColumn(
      "dateFormat",
      "text",
      (col) => col.notNull().defaultTo("yyyy-MM-dd"), // date-fns ISO
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("dataSource").dropColumn("dateFormat").execute();
}
