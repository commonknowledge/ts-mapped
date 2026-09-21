import { db } from "@/server/services/database";
import { toGeography } from "@/server/services/database/geography";
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
  const values = {
    ...placedMarker,
    point: toGeography(placedMarker.point),
  };
  return db
    .insertInto("placedMarker")
    .values(values)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(values))
    .returningAll()
    .executeTakeFirstOrThrow();
}
