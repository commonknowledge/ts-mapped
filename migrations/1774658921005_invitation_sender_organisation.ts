/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add nullable column first
  await db.schema
    .alterTable("invitation")
    .addColumn("senderOrganisationId", "uuid")
    .execute();

  // Backfill: assign all existing invitations to the admin organisation
  await sql`
    UPDATE invitation
    SET "sender_organisation_id" = (
      SELECT id FROM organisation WHERE name = 'Common Knowledge' LIMIT 1
    )
    WHERE "sender_organisation_id" IS NULL
  `.execute(db);

  // Add foreign key constraint
  await db.schema
    .alterTable("invitation")
    .addForeignKeyConstraint(
      "invitationSenderOrganisationIdFKey",
      ["senderOrganisationId"],
      "organisation",
      ["id"],
      (cb) => cb.onDelete("set null").onUpdate("cascade"),
    )
    .execute();

  // Make column not null after backfill
  await db.schema
    .alterTable("invitation")
    .alterColumn("senderOrganisationId", (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("invitation")
    .dropConstraint("invitationSenderOrganisationIdFKey")
    .execute();

  await db.schema
    .alterTable("invitation")
    .dropColumn("senderOrganisationId")
    .execute();
}
