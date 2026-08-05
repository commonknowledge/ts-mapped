import { randomBytes } from "crypto";

import { db } from "@/server/services/database";
import type { MapConfig } from "@/models/Map";
import type { MapViewConfig } from "@/models/MapView";
import type { TraversedJSONPathBuilder } from "kysely";

// 18 random bytes → 24-char base64url token (144 bits of entropy).
// The URL is itself a secret for passwordless shares.
const generateShareToken = () => randomBytes(18).toString("base64url");

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

/**
 * Enable sharing for a map. The first call creates the share with a fresh
 * token; later calls re-enable it, keeping the existing token and password
 * so a disabled link is restored rather than replaced.
 */
export function upsertMapShareForMap(mapId: string) {
  return db
    .insertInto("mapShare")
    .values({ mapId, token: generateShareToken(), enabled: true })
    .onConflict((oc) => oc.column("mapId").doUpdateSet({ enabled: true }))
    .returningAll()
    .executeTakeFirstOrThrow();
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
 * Set (or remove, with `passwordHash: null`) the share password hash.
 * Hashing happens in the caller (see the mapShare router) to keep this
 * module free of auth imports. Always bumps `passwordUpdatedAt` so viewer
 * grants issued before the change stop validating.
 */
export function setMapSharePassword({
  mapId,
  passwordHash,
}: {
  mapId: string;
  passwordHash: string | null;
}) {
  return db
    .updateTable("mapShare")
    .set({ passwordHash, passwordUpdatedAt: new Date() })
    .where("mapId", "=", mapId)
    .returningAll()
    .executeTakeFirst();
}

/**
 * Find an enabled share, among the given maps, whose map visualises this
 * data source — via the map's membersDataSourceId or markerDataSourceIds,
 * or any of the map's views' areaDataSourceId. Used to decide whether a
 * share-grant holder may read the data source's records; mirrors
 * `findPublishedPublicMapByDataSourceId`, but across all views of the map.
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

/** Rotate the token, invalidating the previously shared URL. */
export function regenerateMapShareToken(mapId: string) {
  return db
    .updateTable("mapShare")
    .set({ token: generateShareToken() })
    .where("mapId", "=", mapId)
    .returningAll()
    .executeTakeFirst();
}
