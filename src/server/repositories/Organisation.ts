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
    .selectAll("organisation")
    .execute();
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
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
