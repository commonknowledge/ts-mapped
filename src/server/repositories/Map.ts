import { db } from "@/server/services/database";

export async function ensureOrganisationMap(organisationId: string) {
  const existingMap = await db
    .selectFrom("map")
    .where("organisationId", "=", organisationId)
    .selectAll()
    .executeTakeFirst();

  if (existingMap) {
    return existingMap;
  }

  return db
    .insertInto("map")
    .values({ organisationId, name: "Example Map" })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function findMapById(id: string) {
  return db
    .selectFrom("map")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function findMapsByOrganisationId(organisationId: string) {
  return db
    .selectFrom("map")
    .where("organisationId", "=", organisationId)
    .selectAll()
    .execute();
}
