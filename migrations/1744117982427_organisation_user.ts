/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("organisationUser")
    .addColumn("id", "bigserial", (col) => col.notNull())
    .addColumn("organisationId", "uuid", (col) => col.notNull())
    .addColumn("userId", "uuid", (col) => col.notNull())
    .addUniqueConstraint("organisationUserUnique", ["organisationId", "userId"])
    .addForeignKeyConstraint(
      "organisationUserOrganisationIdFKey",
      ["organisationId"],
      "organisation",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .addForeignKeyConstraint(
      "organisationUserUserIdFKey",
      ["userId"],
      "user",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("organisationUser").execute();
}
