import { NewMapView } from "@/server/models/MapView";
import { db } from "@/server/services/database";

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
