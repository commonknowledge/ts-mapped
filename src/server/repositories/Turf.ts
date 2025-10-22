import { db } from "@/server/services/database";
import type { NewTurf, TurfUpdate } from "@/server/models/Turf";

export function findTurfsByMapId(mapId: string) {
  return db.selectFrom("turf").where("mapId", "=", mapId).selectAll().execute();
}

export async function deleteTurf(id: string) {
  return db
    .deleteFrom("turf")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
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

export async function upsertTurf(turf: NewTurf) {
  return db
    .insertInto("turf")
    .values(turf)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(turf))
    .returningAll()
    .executeTakeFirstOrThrow();
}
