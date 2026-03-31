import { sql } from "kysely";
import { db } from "@/server/services/database";
import type { NewTurf } from "@/server/models/Turf";

const turfColumns = [
  "turf.id",
  "turf.label",
  "turf.notes",
  "turf.area",
  "turf.mapId",
  "turf.createdAt",
  "turf.color",
  "turf.folderId",
  "turf.position",
] as const;

function selectTurfColumns() {
  return [...turfColumns, sql<string>`ST_AsGeoJSON(polygon)`.as("polygon")];
}

export function findTurfsByMapId(mapId: string) {
  return db
    .selectFrom("turf")
    .where("mapId", "=", mapId)
    .select(selectTurfColumns())
    .execute();
}

export async function deleteTurf(id: string) {
  return db.deleteFrom("turf").where("id", "=", id).execute();
}

export async function deleteTurfsByFolderId(folderId: string) {
  return db.deleteFrom("turf").where("folderId", "=", folderId).execute();
}

export async function upsertTurf(turf: NewTurf) {
  const { polygon, ...rest } = turf;
  const polygonExpr = sql<string>`ST_SetSRID(ST_GeomFromGeoJSON(${polygon}), 4326)::geography`;
  const values = { ...rest, polygon: polygonExpr } as unknown as NewTurf;
  return db
    .insertInto("turf")
    .values(values)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(values))
    .returning(selectTurfColumns())
    .executeTakeFirstOrThrow();
}
