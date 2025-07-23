import {
  NewPlacedMarker,
  PlacedMarkerUpdate,
} from "@/server/models/PlacedMarker";
import { db } from "@/server/services/database";

export function findPlacedMarkersByMapId(mapId: string) {
  return db
    .selectFrom("placedMarker")
    .where("mapId", "=", mapId)
    .orderBy("position", "asc")
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
  placedMarker: PlacedMarkerUpdate
) {
  return db
    .updateTable("placedMarker")
    .set(placedMarker)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getNextPosition(mapId: string): Promise<number> {
  const result = await db
    .selectFrom("placedMarker")
    .where("mapId", "=", mapId)
    .select(db.fn.max("position").as("maxPosition"))
    .executeTakeFirst();

  return (result?.maxPosition ?? -1) + 1;
}

export async function updateMarkerPositions(
  mapId: string,
  markerPositions: { id: string; position: number }[]
) {
  // Use a transaction to update all positions atomically
  return db.transaction().execute(async (trx) => {
    for (const { id, position } of markerPositions) {
      await trx
        .updateTable("placedMarker")
        .set({ position })
        .where("id", "=", id)
        .where("mapId", "=", mapId)
        .execute();
    }
  });
}
