/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("folder")
    .addColumn("position", sql`double precision`, (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("folder").dropColumn("position").execute();
}
