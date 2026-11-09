/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Organisation admins: `organisation_user.role` is "Admin" or "Member".
 * Admins can invite members and remove non-admin members from the
 * organisation. The earliest member of each existing organisation is made
 * its admin.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("organisationUser")
    .addColumn("role", "text", (col) => col.notNull().defaultTo("Member"))
    .execute();

  await sql`
    UPDATE organisation_user
    SET role = 'Admin'
    WHERE id IN (
      SELECT MIN(id) FROM organisation_user GROUP BY organisation_id
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("organisationUser").dropColumn("role").execute();
}
