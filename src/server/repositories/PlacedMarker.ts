import {
  NewPlacedMarker,
  PlacedMarkerUpdate,
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

export async function insertPlacedMarker(placedMarker: NewPlacedMarker) {
  return db
    .insertInto("placedMarker")
    .values(placedMarker)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updatePlacedMarker(
  id: string,
  placedMarker: PlacedMarkerUpdate,
) {
  return db
    .updateTable("placedMarker")
    .set(placedMarker)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}
