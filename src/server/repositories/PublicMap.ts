import { db } from "@/server/services/database";

export function findPublicMapByHostname(hostname: string) {
  return db
    .selectFrom("publicMap")
    .where("hostname", "=", hostname)
    .selectAll()
    .executeTakeFirst();
}

export function findPublicMapByMapId(mapId: string) {
  return db
    .selectFrom("publicMap")
    .where("mapId", "=", mapId)
    .selectAll()
    .executeTakeFirst();
}
