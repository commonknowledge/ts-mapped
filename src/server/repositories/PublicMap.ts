import { db } from "@/server/services/database";
import type { MapConfig } from "@/server/models/Map";
import type { NewPublicMap, PublicMapDraft } from "@/server/models/PublicMap";
import type { TraversedJSONPathBuilder } from "kysely";

export function findPublicMapByHost(host: string) {
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
 * Matches maps that have the data source in the memberDataSourceId, markerDataSourceIds,
 * or associated view areaDataSourceId.
 *
 * Is the inverse of getVisualisedDataSourceIds in src/utils/map.ts.
 */
export async function findPublishedPublicMapByDataSourceId(
  dataSourceId: string,
) {
  // Find maps that reference this data source in their config
  const mapsFromConfig = await db
    .selectFrom("map")
    .where(({ eb, ref }) => {
      return eb.or([
        eb(ref("config", "->>").key("membersDataSourceId"), "=", dataSourceId),
        eb(
          // The typing here is weird because the "@>" operator in kysely only
          // allows for arrays on the right-hand side, but because a JSON
          // object is being queried, a JSON string needs to be provided
          ref("config", "->").key(
            "markerDataSourceIds",
          ) as TraversedJSONPathBuilder<MapConfig, string>,
          "@>",
          JSON.stringify([dataSourceId]),
        ),
      ]);
    })
    .select("id")
    .execute();

  // Find maps that reference this data source in their views
  const mapsFromViews = await db
    .selectFrom("mapView")
    .where(({ eb, ref }) => {
      return eb(
        ref("config", "->>").key("areaDataSourceId"),
        "=",
        dataSourceId,
      );
    })
    .select("mapId as id")
    .execute();

  const mapIds = [
    ...new Set([
      ...mapsFromConfig.map((m) => m.id),
      ...mapsFromViews.map((m) => m.id),
    ]),
  ];

  if (!mapIds.length) {
    return null;
  }

  return db
    .selectFrom("publicMap")
    .where("published", "=", true)
    .where("mapId", "in", mapIds)
    .selectAll()
    .executeTakeFirst();
}

export function upsertPublicMap(publicMap: NewPublicMap) {
  return db
    .insertInto("publicMap")
    .values(publicMap)
    .onConflict((oc) => oc.columns(["viewId"]).doUpdateSet(publicMap))
    .returningAll()
    .executeTakeFirstOrThrow();
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
      host: "",
      name: "My Public Map",
      description: "",
      descriptionLong: "",
      descriptionLink: "",
      imageUrl: "",
      published: false,
      dataSourceConfigs: "[]" as unknown as never,
      colorScheme: "red",
      draft: JSON.stringify(input.draft),
    })
    .onConflict((oc) =>
      oc
        .columns(["viewId"])
        .doUpdateSet({ draft: JSON.stringify(input.draft) }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

export function publishDraft(input: {
  id: string;
  mapId: string;
  viewId: string;
  draft: PublicMapDraft;
}) {
  const promoted = {
    host: input.draft.host,
    name: input.draft.name,
    description: input.draft.description,
    descriptionLong: input.draft.descriptionLong,
    descriptionLink: input.draft.descriptionLink,
    imageUrl: input.draft.imageUrl,
    published: input.draft.published,
    dataSourceConfigs: JSON.stringify(
      input.draft.dataSourceConfigs,
    ) as unknown as never,
    colorScheme: input.draft.colorScheme,
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
  let query = db.selectFrom("publicMap").where("host", "=", host).selectAll();

  if (excludeViewId) {
    query = query.where("viewId", "!=", excludeViewId);
  }

  return query.executeTakeFirst();
}
