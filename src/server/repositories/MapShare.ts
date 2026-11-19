import { randomBytes } from "crypto";

import { db } from "@/server/services/database";
import type { MapConfig } from "@/models/Map";
import type { MapViewConfig } from "@/models/MapView";
import type { TraversedJSONPathBuilder } from "kysely";

// 18 random bytes → 24-char base64url token (144 bits of entropy). The
// link alone grants nothing (visitors must be approved), but an
// unguessable link keeps the map's name and request form unlisted.
const generateShareToken = () => randomBytes(18).toString("base64url");

export function findMapShareById(id: string) {
  return db
    .selectFrom("mapShare")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function findMapShareByToken(token: string) {
  return db
    .selectFrom("mapShare")
    .where("token", "=", token)
    .selectAll()
    .executeTakeFirst();
}

export function findMapShareByMapId(mapId: string) {
  return db
    .selectFrom("mapShare")
    .where("mapId", "=", mapId)
    .selectAll()
    .executeTakeFirst();
}

export function setMapShareEnabled({
  mapId,
  enabled,
}: {
  mapId: string;
  enabled: boolean;
}) {
  return db
    .updateTable("mapShare")
    .set({ enabled })
    .where("mapId", "=", mapId)
    .returningAll()
    .executeTakeFirst();
}

/**
 * Create the share if needed, and set who is emailed about access requests.
 * Creating it this way leaves it disabled: sharing is turned on separately,
 * once there are moderators.
 */
export function setMapShareModeratorEmails({
  mapId,
  moderatorEmails,
}: {
  mapId: string;
  moderatorEmails: string[];
}) {
  return db
    .insertInto("mapShare")
    .values({
      mapId,
      token: generateShareToken(),
      enabled: false,
      moderatorEmails,
    })
    .onConflict((oc) => oc.column("mapId").doUpdateSet({ moderatorEmails }))
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Find an enabled share, among the given maps, whose map visualises this
 * data source — via the map's membersDataSourceId or markerDataSourceIds,
 * or any of the map's views' areaDataSourceId. Used to decide whether a
 * share-grant holder may read the data source's records; mirrors
 * `findPublishedPublicMapsByDataSourceId`, but across all views of the map.
 */
export function findMapShareVisualisingDataSource({
  dataSourceId,
  mapIds,
}: {
  dataSourceId: string;
  mapIds: string[];
}) {
  if (mapIds.length === 0) {
    return Promise.resolve(undefined);
  }
  return db
    .selectFrom("mapShare")
    .innerJoin("map", "map.id", "mapShare.mapId")
    .where("mapShare.mapId", "in", mapIds)
    .where("mapShare.enabled", "=", true)
    .where(({ eb, exists, ref, selectFrom }) =>
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
        exists(
          selectFrom("mapView")
            .select("mapView.id")
            .whereRef("mapView.mapId", "=", "map.id")
            .where(({ eb: viewEb, ref: viewRef }) =>
              viewEb(
                viewRef("mapView.config", "->>").key(
                  "areaDataSourceId",
                ) as TraversedJSONPathBuilder<MapViewConfig, string>,
                "=",
                dataSourceId,
              ),
            ),
        ),
      ]),
    )
    .selectAll("mapShare")
    .executeTakeFirst();
}
