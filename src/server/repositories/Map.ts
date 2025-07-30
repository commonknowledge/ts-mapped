import { MapConfig } from "@/__generated__/types";
import { MapUpdate } from "@/server/models/Map";
import { db } from "@/server/services/database";

const createBlankConfig = (): MapConfig => {
  return {
    markerDataSourceIds: [],
    membersDataSourceId: "",
  };
};

export async function createMap(organisationId: string) {
  return db
    .insertInto("map")
    .values({
      organisationId,
      name: "Untitled Map",
      config: JSON.stringify(createBlankConfig()),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteMap(id: string) {
  return db.deleteFrom("map").where("id", "=", id).executeTakeFirstOrThrow();
}

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
    .values({
      organisationId,
      name: "Example Map",
      config: JSON.stringify(createBlankConfig()),
    })
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

export function updateMap(id: string, map: MapUpdate) {
  return db
    .updateTable("map")
    .where("id", "=", id)
    .set(map)
    .returningAll()
    .executeTakeFirstOrThrow();
}
