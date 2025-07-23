import { sql } from "kysely";
import {
  MarkerFolderUpdate,
  NewMarkerFolder,
} from "@/server/models/MarkerFolder";
import { db } from "@/server/services/database";

export function findMarkerFoldersByMapId(mapId: string) {
  return db
    .selectFrom("markerFolder")
    .where("mapId", "=", mapId)
    .orderBy("position")
    .selectAll()
    .execute();
}

export async function insertMarkerFolder(markerFolder: NewMarkerFolder) {
  // Get the next position if not provided
  let position = markerFolder.position;
  if (position === undefined) {
    const maxPosition = await db
      .selectFrom("markerFolder")
      .where("mapId", "=", markerFolder.mapId)
      .select((eb) => eb.fn.max("position").as("maxPosition"))
      .executeTakeFirst();

    position = ((maxPosition?.maxPosition as number) || 0) + 1000;
  }

  return db
    .insertInto("markerFolder")
    .values({
      ...markerFolder,
      position,
      markerIds: sql`${JSON.stringify(markerFolder.markerIds)}::jsonb`,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateMarkerFolder(
  id: string,
  markerFolder: MarkerFolderUpdate
) {
  const updateData: Record<string, unknown> = { ...markerFolder };

  // Handle markerIds JSONB serialization
  if (markerFolder.markerIds !== undefined) {
    updateData.markerIds = sql`${JSON.stringify(markerFolder.markerIds)}::jsonb`;
  }

  return db
    .updateTable("markerFolder")
    .set(updateData)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteMarkerFolder(id: string) {
  return db
    .deleteFrom("markerFolder")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateMarkerFolderPositions(
  folderPositions: { id: string; position: number }[]
) {
  // Use a transaction to update all positions atomically
  return db.transaction().execute(async (trx) => {
    const updates = folderPositions.map(async ({ id, position }) => {
      return await trx
        .updateTable("markerFolder")
        .set({ position })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    });

    return Promise.all(updates);
  });
}
