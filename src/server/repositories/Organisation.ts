import { NewOrganisation } from "@/server/models/Organisation";
import { db } from "@/server/services/database";

export function findOrganisationsByUserId(userId: string) {
  return db
    .selectFrom("organisation")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId",
    )
    .where("organisationUser.userId", "=", userId)
    .select(["organisation.id", "organisation.name"])
    .execute();
}

export function upsertOrganisation(organisation: NewOrganisation) {
  return db
    .insertInto("organisation")
    .values(organisation)
    .onConflict((oc) =>
      oc.columns(["name"]).doUpdateSet({
        name: organisation.name,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
