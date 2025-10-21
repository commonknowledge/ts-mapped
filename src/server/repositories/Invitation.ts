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

export function updateUnusedInvitation(id: string, data: InvitationUpdate) {
  console.log("updating", data);
  return db
    .updateTable("invitation")
    .where("id", "=", id)
    .where("used", "=", false)
    .set({
      ...data,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
