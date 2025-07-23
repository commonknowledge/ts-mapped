import {
  NewPlacedMarker,
} from "@/server/models/PlacedMarker";
import { db } from "@/server/services/database";

export function findPlacedMarkersByMapId(mapId: string) {
  return db
    .selectFrom("placedMarker")
    .where("mapId", "=", mapId)
    .selectAll()
    .execute();
}

export async function deletePlacedMarker(id: string) {
  return db.deleteFrom("placedMarker").where("id", "=", id).execute();
}

export async function upsertPlacedMarker(
  placedMarker: NewPlacedMarker,
) {
  return db
    .insertInto("placedMarker")
    .values(placedMarker)
     .onConflict((oc) =>
      oc.columns(["id"]).doUpdateSet(placedMarker),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
