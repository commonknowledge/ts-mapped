import { db } from "@/server/services/database";
import type { MapConfig } from "@/__generated__/types";
import type { NewPublicMap } from "@/server/models/PublicMap";
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

export async function findPublishedPublicMapByDataSourceId(
  dataSourceId: string,
) {
  const maps = await db
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

  if (!maps.length) {
    return null;
  }

  return db
    .selectFrom("publicMap")
    .where("published", "=", true)
    .where(
      "mapId",
      "in",
      maps.map((m) => m.id),
    )
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
