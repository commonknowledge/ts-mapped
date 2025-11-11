import { db } from "@/server/services/database";
import type {
  NewOrganisation,
  OrganisationUpdate,
} from "@/server/models/Organisation";

export function findOrganisationById(id: string) {
  return db
    .selectFrom("organisation")
    .where("id", "=", id)
    .selectAll("organisation")
    .executeTakeFirstOrThrow();
}

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
      "organisationUser.organisationId",
    )
    .where("organisationUser.userId", "=", userId)
    .selectAll("organisation")
    .orderBy("createdAt asc")
    .execute();
}

export function findOrganisationForUser(
  organisationId: string,
  userId: string,
) {
  return db
    .selectFrom("organisation")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId",
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

export function listOrganisations() {
  return db
    .selectFrom("organisation")
    .selectAll()
    .orderBy((eb) => eb.fn("lower", ["name"]))
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

export function updateOrganisation(
  id: string,
  organisation: OrganisationUpdate,
) {
  return db
    .updateTable("organisation")
    .set(organisation)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}
