/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("organisation")
    .set({
      features: sql`features || '["InviteUsers"]'::jsonb`,
    })
    .where(sql<boolean>`NOT features @> '["InviteUsers"]'`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("organisation")
    .set({
      features: sql`features - 'InviteUsers'`,
    })
    .execute();
}
