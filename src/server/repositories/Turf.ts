import { NewTurf, TurfUpdate } from "@/server/models/Turf";
import { db } from "@/server/services/database";

export function findTurfsByMapId(mapId: string) {
  return db.selectFrom("turf").where("mapId", "=", mapId).selectAll().execute();
}

export async function deleteTurf(id: string) {
  return db.deleteFrom("turf").where("id", "=", id).execute();
}

export async function insertTurf(turf: NewTurf) {
  return db
    .insertInto("turf")
    .values(turf)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateTurf(id: string, turf: TurfUpdate) {
  return db
    .updateTable("turf")
    .set(turf)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}
