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
    .selectAll()
    .execute();
}

export async function insertMarkerFolder(markerFolder: NewMarkerFolder) {
  return db
    .insertInto("markerFolder")
    .values({
      ...markerFolder,
      markerIds: sql`${JSON.stringify(markerFolder.markerIds)}::jsonb`,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateMarkerFolder(
  id: string,
  markerFolder: MarkerFolderUpdate
) {
  const updateData: any = { ...markerFolder };

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
