import { db } from "@/server/services/database";
import type { MapViewUpdate, NewMapView } from "../models/MapView";

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

export function updateMapView(id: string, view: MapViewUpdate) {
  return db
    .updateTable("mapView")
    .where("id", "=", id)
    .set(view)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Removes all references to a (deleted) data source from the views of every
 * map in the given organisation: both `dataSourceViews` entries and a view's
 * choropleth `areaDataSourceId`. Only rewrites rows that actually change.
 */
export async function removeDataSourceFromMapViews({
  organisationId,
  dataSourceId,
}: {
  organisationId: string;
  dataSourceId: string;
}) {
  const views = await db
    .selectFrom("mapView")
    .innerJoin("map", "map.id", "mapView.mapId")
    .where("map.organisationId", "=", organisationId)
    .selectAll("mapView")
    .execute();
  for (const view of views) {
    const dataSourceViews = view.dataSourceViews.filter(
      (dsv) => dsv.dataSourceId !== dataSourceId,
    );
    const clearArea = view.config.areaDataSourceId === dataSourceId;
    const changed =
      dataSourceViews.length !== view.dataSourceViews.length || clearArea;
    if (changed) {
      await updateMapView(view.id, {
        dataSourceViews,
        config: clearArea
          ? { ...view.config, areaDataSourceId: "" }
          : view.config,
      });
    }
  }
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
