import { db } from "@/server/services/database";
import type { NewOrganisationUser } from "@/server/models/OrganisationUser";

export function upsertOrganisationUser(organisationUser: NewOrganisationUser) {
  return db
    .insertInto("organisationUser")
    .values(organisationUser)
    .onConflict((oc) =>
      // This is a dummy on conflict statement, because
      // ON CONFLICT DO NOTHING doesn't return anything.
      oc.columns(["organisationId", "userId"]).doUpdateSet({
        organisationId: organisationUser.organisationId,
        userId: organisationUser.userId,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function findOrganisationUser(
  organisationId: string,
  userId: string,
) {
  return await db
    .selectFrom("organisationUser")
    .where("organisationId", "=", organisationId)
    .where("userId", "=", userId)
    .selectAll()
    .executeTakeFirst();
}
