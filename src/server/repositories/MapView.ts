import { MapViewUpdate, NewMapView } from "@/server/models/MapView";
import { db } from "@/server/services/database";

export function findMapViewsByMapId(mapId: string) {
  return db
    .selectFrom("mapView")
    .where("mapId", "=", mapId)
    .selectAll()
    .execute();
}

export function insertMapView(mapView: NewMapView) {
  return db
    .insertInto("mapView")
    .values(mapView)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function updateMapView(id: string, updateWith: MapViewUpdate) {
  return db
    .updateTable("mapView")
    .set(updateWith)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
}
