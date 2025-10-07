import { db } from "@/server/services/database";
import type { MapConfig } from "@/__generated__/types";
import type { MapUpdate } from "@/server/models/Map";

const createBlankConfig = (): MapConfig => {
  return {
    markerDataSourceIds: [],
    membersDataSourceId: "",
  };
};

export async function createMap(organisationId: string, name = "Untitled Map") {
  return db
    .insertInto("map")
    .values({
      organisationId,
      name,
      config: createBlankConfig(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteMap(id: string) {
  return db.deleteFrom("map").where("id", "=", id).executeTakeFirstOrThrow();
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
    .orderBy("createdAt", "desc")
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
