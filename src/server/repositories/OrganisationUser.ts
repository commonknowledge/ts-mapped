import { sql } from "kysely";
import { OrganisationUserRole } from "@/models/OrganisationUser";
import { db } from "@/server/services/database";
import type { NewOrganisationUser } from "@/server/models/OrganisationUser";

/**
 * Add a user to an organisation. Unless a role is given, the first member of
 * an organisation becomes its admin, and later members are regular members.
 * An existing membership is left unchanged.
 */
export function upsertOrganisationUser(organisationUser: NewOrganisationUser) {
  return db
    .insertInto("organisationUser")
    .values((eb) => ({
      organisationId: organisationUser.organisationId,
      userId: organisationUser.userId,
      role:
        organisationUser.role ??
        eb
          .case()
          .when(
            eb.exists(
              eb
                .selectFrom("organisationUser")
                .select("organisationUser.id")
                .where(
                  "organisationUser.organisationId",
                  "=",
                  organisationUser.organisationId,
                ),
            ),
          )
          .then(OrganisationUserRole.Member)
          .else(OrganisationUserRole.Admin)
          .end(),
    }))
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
    .select([
      "user.id",
      "user.email",
      "user.name",
      "user.avatarUrl",
      "organisationUser.role",
    ])
    .orderBy(sql`NULLIF(${sql.ref("user.name")}, '') asc nulls last`)
    .execute();
}

export function updateOrganisationUserRole({
  organisationId,
  userId,
  role,
}: {
  organisationId: string;
  userId: string;
  role: OrganisationUserRole;
}) {
  return db
    .updateTable("organisationUser")
    .where("organisationId", "=", organisationId)
    .where("userId", "=", userId)
    .set({ role })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function deleteOrganisationUser(organisationId: string, userId: string) {
  return db
    .deleteFrom("organisationUser")
    .where("organisationId", "=", organisationId)
    .where("userId", "=", userId)
    .executeTakeFirstOrThrow();
}
