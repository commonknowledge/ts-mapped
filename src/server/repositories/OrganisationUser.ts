import { sql } from "kysely";
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

export function findUsersByOrganisationId(organisationId: string) {
  return db
    .selectFrom("organisationUser")
    .innerJoin("user", "user.id", "organisationUser.userId")
    .where("organisationUser.organisationId", "=", organisationId)
    .select(["user.id", "user.email", "user.name", "user.avatarUrl"])
    .orderBy(sql`NULLIF(${sql.ref("user.name")}, '') asc nulls last`)
    .execute();
}
