import { NewOrganisation } from "@/server/models/Organisation";
import { db } from "@/server/services/database";

export function findOrganisationByName(name: string) {
  return db
    .selectFrom("organisation")
    .where("name", "=", name)
    .selectAll("organisation")
    .executeTakeFirstOrThrow();
}

export function findOrganisationsByUserId(userId: string) {
  return db
    .selectFrom("organisation")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .where("organisationUser.userId", "=", userId)
    .selectAll("organisation")
    .execute();
}
export function findOrganisationForUser(
  organisationId: string,
  userId: string
) {
  return db
    .selectFrom("organisation")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .where("organisationUser.userId", "=", userId)
    .where("organisationUser.organisationId", "=", organisationId)
    .selectAll("organisation")
    .executeTakeFirst();
}

export async function deleteOrganisation(id: string) {
  return db
    .deleteFrom("organisation")
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
}

export function upsertOrganisation(organisation: NewOrganisation) {
  return db
    .insertInto("organisation")
    .values(organisation)
    .onConflict((oc) =>
      // This is a dummy on conflict statement, because
      // ON CONFLICT DO NOTHING doesn't return anything.
      oc.columns(["name"]).doUpdateSet({
        name: organisation.name,
      })
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
