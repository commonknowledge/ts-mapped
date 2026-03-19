import { type SqlBool, type TraversedJSONPathBuilder, sql } from "kysely";

import { db } from "@/server/services/database";
import type { MapConfig } from "@/server/models/Map";
import type { MapViewConfig } from "@/server/models/MapView";
import type { PublicMapDraft } from "@/server/models/PublicMap";

export function findPublicMapByHost(host: string) {
  if (!host) return Promise.resolve(undefined);
  return db
    .selectFrom("publicMap")
    .where("host", "=", host)
    .selectAll()
    .executeTakeFirst();
}

export function findPublishedPublicMapByMapId(mapId: string) {
  return db
    .selectFrom("publicMap")
    .where("mapId", "=", mapId)
    .where("published", "=", true)
    .selectAll()
    .executeTakeFirst();
}

export function findPublicMapByViewId(viewId: string) {
  return db
    .selectFrom("publicMap")
    .where("viewId", "=", viewId)
    .selectAll()
    .executeTakeFirst();
}

export function findPublicMapByViewIdAndUserId(viewId: string, userId: string) {
  return db
    .selectFrom("publicMap")
    .where("viewId", "=", viewId)
    .innerJoin("map", "map.id", "publicMap.mapId")
    .innerJoin("organisation", "organisation.id", "map.organisationId")
    .innerJoin(
      "organisationUser",
      "organisationUser.organisationId",
      "organisation.id",
    )
    .where("organisationUser.userId", "=", userId)
    .selectAll("publicMap")
    .executeTakeFirst();
}

/**
 * Find a published public map whose dataSourceConfigs reference this
 * dataSourceId, verifying that the dataSourceId is also present in one of
 * map->membersDataSourceId, map->markerDataSourceIds, or view->areaDataSourceId.
 */
export async function findPublishedPublicMapByDataSourceId(
  dataSourceId: string,
) {
  return db
    .selectFrom("publicMap")
    .where("published", "=", true)
    .where(
      sql<SqlBool>`${sql.ref("publicMap.dataSourceConfigs")} @> ${JSON.stringify([{ dataSourceId }])}::jsonb`,
    )
    .innerJoin("map", "map.id", "publicMap.mapId")
    .innerJoin("mapView", "mapView.id", "publicMap.viewId")
    .where(({ eb, ref }) =>
      eb.or([
        eb(
          ref("map.config", "->>").key("membersDataSourceId"),
          "=",
          dataSourceId,
        ),
        eb(
          ref("map.config", "->").key(
            "markerDataSourceIds",
          ) as TraversedJSONPathBuilder<MapConfig, string>,
          "@>",
          JSON.stringify([dataSourceId]),
        ),
        eb(
          ref("mapView.config", "->>").key(
            "areaDataSourceId",
          ) as TraversedJSONPathBuilder<MapViewConfig, string>,
          "=",
          dataSourceId,
        ),
      ]),
    )
    .selectAll("publicMap")
    .executeTakeFirst();
}

export function findPublicMapsByOrganisationId(organisationId: string) {
  return db
    .selectFrom("publicMap")
    .innerJoin("map", "map.id", "publicMap.mapId")
    .where("map.organisationId", "=", organisationId)
    .selectAll("publicMap")
    .execute();
}

export function saveDraft(input: {
  id: string;
  mapId: string;
  viewId: string;
  draft: PublicMapDraft;
}) {
  return db
    .insertInto("publicMap")
    .values({
      id: input.id,
      mapId: input.mapId,
      viewId: input.viewId,
      host: null,
      name: "My Public Map",
      description: "",
      descriptionLong: "",
      descriptionLink: "",
      imageUrl: "",
      published: false,
      dataSourceConfigs: [],
      colorScheme: "red",
      draft: input.draft,
    })
    .onConflict((oc) =>
      oc.columns(["viewId"]).doUpdateSet({ draft: input.draft }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function applyDraft(input: {
  id: string;
  mapId: string;
  viewId: string;
  draft: PublicMapDraft;
}) {
  const promoted = {
    ...input.draft,
    draft: null,
  };

  // Promote draft fields to the live columns and clear the draft.
  // Upserts so the row is created if it doesn't exist yet.
  return db
    .insertInto("publicMap")
    .values({
      id: input.id,
      mapId: input.mapId,
      viewId: input.viewId,
      ...promoted,
      // Prevent empty host being saved
      host: promoted.host === "" ? null : promoted.host,
    })
    .onConflict((oc) => oc.columns(["viewId"]).doUpdateSet(promoted))
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function discardDraft(viewId: string) {
  return db
    .updateTable("publicMap")
    .set({ draft: null })
    .where("viewId", "=", viewId)
    .returningAll()
    .executeTakeFirst();
}

export function checkHostAvailability(host: string, excludeViewId?: string) {
  if (!host) return Promise.resolve(undefined);
  let query = db.selectFrom("publicMap").where("host", "=", host).selectAll();

  if (excludeViewId) {
    query = query.where("viewId", "!=", excludeViewId);
  }

  return query.executeTakeFirst();
}
