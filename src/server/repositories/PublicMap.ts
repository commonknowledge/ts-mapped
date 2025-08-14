import { NewPublicMap } from "@/server/models/PublicMap";
import { db } from "@/server/services/database";

export function findPublicMapByHost(host: string) {
  return db
    .selectFrom("publicMap")
    .where("host", "=", host)
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

export function findPublicMapByViewId(viewId: string) {
  return db
    .selectFrom("publicMap")
    .where("viewId", "=", viewId)
    .selectAll()
    .executeTakeFirst();
}

export function upsertPublicMap(publicMap: NewPublicMap) {
  return db
    .insertInto("publicMap")
    .values(publicMap)
    .onConflict((oc) => oc.columns(["viewId"]).doUpdateSet(publicMap))
    .returningAll()
    .executeTakeFirstOrThrow();
}
