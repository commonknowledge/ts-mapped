/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .addForeignKeyConstraint(
      "dataSourceOrganisationIdFKey",
      ["organisationId"],
      "organisation",
      ["id"],
    )
    .onDelete("cascade")
    .onUpdate("cascade")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropConstraint("dataSourceOrganisationIdFKey")
    .execute();
}
