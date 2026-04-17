/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("invitation")
    .addColumn("trialDays", "integer")
    .execute();

  // Backfill existing trial invitations with the default trial period
  await db
    .updateTable("invitation")
    .where("isTrial", "=", true)
    .set({ trialDays: 30 })
    .execute();

  await db.schema.alterTable("invitation").dropColumn("isTrial").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("invitation")
    .addColumn("isTrial", "boolean", (col) =>
      col.notNull().defaultTo(sql`false`),
    )
    .execute();

  // Restore isTrial from trialDays
  await db
    .updateTable("invitation")
    .where("trialDays", "is not", null)
    .set({ isTrial: true })
    .execute();

  await db.schema.alterTable("invitation").dropColumn("trialDays").execute();
}
