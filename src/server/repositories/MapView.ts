import { db } from "@/server/services/database";
import type { NewMapView } from "../models/MapView";

export function findMapViewById(viewId: string) {
  return db
    .selectFrom("mapView")
    .where("id", "=", viewId)
    .selectAll()
    .executeTakeFirst();
}

export function findMapViewsByMapId(mapId: string) {
  return db
    .selectFrom("mapView")
    .where("mapId", "=", mapId)
    .selectAll()
    .orderBy("position asc")
    .orderBy("id asc")
    .execute();
}

export async function upsertMapView(view: NewMapView) {
  return db
    .insertInto("mapView")
    .values(view)
    .onConflict((oc) => oc.columns(["id"]).doUpdateSet(view))
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteMapView(id: string) {
  return db.deleteFrom("mapView").where("id", "=", id).execute();
}

export async function assertViewBelongsToMap({
  viewId,
  mapId,
}: {
  viewId: string;
  mapId: string;
}) {
  const view = await db
    .selectFrom("mapView")
    .where("id", "=", viewId)
    .where("mapId", "=", mapId)
    .select("id")
    .executeTakeFirst();
  if (!view) {
    throw new Error("View not found");
  }
}
