import { sql } from "kysely";
import { db } from "@/server/services/database";
import type {
  InvitationUpdate,
  NewInvitation,
} from "@/server/models/Invitation";

export function createInvitation(invitation: NewInvitation) {
  return db
    .insertInto("invitation")
    .values(invitation)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function findInvitationById(id: string) {
  return db
    .selectFrom("invitation")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function listPendingInvitations() {
  return db
    .selectFrom("invitation")
    .leftJoin("organisation", "invitation.organisationId", "organisation.id")
    .where("invitation.userId", "is", null)
    .select([
      "invitation.id",
      "invitation.email",
      "invitation.name",
      "invitation.organisationId",
      "invitation.createdAt",
      "organisation.name as organisationName",
    ])
    .orderBy("invitation.createdAt", "desc")
    .execute();
}

export function updateInvitation(id: string, data: InvitationUpdate) {
  return db
    .updateTable("invitation")
    .where("id", "=", id)
    .set({
      ...data,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
