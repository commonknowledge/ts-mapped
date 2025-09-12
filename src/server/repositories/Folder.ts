import { db } from "@/server/services/database";
import type { NewFolder } from "@/server/models/Folder";

export function findFoldersByMapId(mapId: string) {
  return db
    .selectFrom("folder")
    .where("mapId", "=", mapId)
    .orderBy("name asc")
    .selectAll()
    .execute();
}

export async function deleteFolder(id: string) {
  return db.deleteFrom("folder").where("id", "=", id).execute();
}

export async function upsertFolder(folder: NewFolder) {
  return db
    .insertInto("folder")
    .values(folder)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(folder))
    .returningAll()
    .executeTakeFirstOrThrow();
}
