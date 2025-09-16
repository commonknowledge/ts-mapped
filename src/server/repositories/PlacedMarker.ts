import { db } from "@/server/services/database";
import type { NewPlacedMarker } from "@/server/models/PlacedMarker";

export function findPlacedMarkersByMapId(mapId: string) {
  return db
    .selectFrom("placedMarker")
    .where("mapId", "=", mapId)
    .orderBy("position asc")
    .orderBy("id asc")
    .selectAll()
    .execute();
}

export async function deletePlacedMarker(id: string) {
  return db.deleteFrom("placedMarker").where("id", "=", id).execute();
}

export async function deletePlacedMarkersByFolderId(folderId: string) {
  return db
    .deleteFrom("placedMarker")
    .where("folderId", "=", folderId)
    .execute();
}

export async function upsertPlacedMarker(placedMarker: NewPlacedMarker) {
  return db
    .insertInto("placedMarker")
    .values(placedMarker)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(placedMarker))
    .returningAll()
    .executeTakeFirstOrThrow();
}
