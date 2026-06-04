import { type SqlBool, type TraversedJSONPathBuilder, sql } from "kysely";

import { db } from "@/server/services/database";
import type { MapConfig } from "@/models/Map";
import type { MapViewConfig } from "@/models/MapView";
import type { PublicMapDraft } from "@/models/PublicMap";
import type { PublicMapUpdate } from "@/server/models/PublicMap";

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
  listed?: boolean;
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
      listed: input.listed ?? false,
      dataSourceConfigs: [],
      colorScheme: "red",
      draft: input.draft,
    })
    .onConflict((oc) =>
      oc.columns(["viewId"]).doUpdateSet({
        draft: input.draft,
        ...(input.listed ? { listed: true } : {}),
      }),
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
    // Prevent empty host being saved
    host: input.draft.host || null,
    draft: null,
    listed: true,
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
  if (!host) return Promise.resolve(undefined);
  let query = db.selectFrom("publicMap").where("host", "=", host).selectAll();

  if (excludeViewId) {
    query = query.where("viewId", "!=", excludeViewId);
  }

  return query.executeTakeFirst();
}

export function updatePublicMap(
  id: string,
  fields: Pick<PublicMapUpdate, "dataSourceConfigs" | "draft">,
) {
  return db
    .updateTable("publicMap")
    .where("id", "=", id)
    .set(fields)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Removes all references to a (deleted) data source from the dataSourceConfigs
 * of every public map in the given organisation — both the live configs and
 * any draft. Only rewrites rows that actually change.
 */
export async function removeDataSourceFromPublicMaps({
  organisationId,
  dataSourceId,
}: {
  organisationId: string;
  dataSourceId: string;
}) {
  const publicMaps = await findPublicMapsByOrganisationId(organisationId);
  for (const publicMap of publicMaps) {
    const dataSourceConfigs = publicMap.dataSourceConfigs.filter(
      (c) => c.dataSourceId !== dataSourceId,
    );
    const configsChanged =
      dataSourceConfigs.length !== publicMap.dataSourceConfigs.length;

    const { draft } = publicMap;
    let draftChanged = false;
    let newDraft = draft;
    if (draft) {
      const draftConfigs = draft.dataSourceConfigs.filter(
        (c) => c.dataSourceId !== dataSourceId,
      );
      if (draftConfigs.length !== draft.dataSourceConfigs.length) {
        draftChanged = true;
        newDraft = { ...draft, dataSourceConfigs: draftConfigs };
      }
    }

    if (configsChanged || draftChanged) {
      await updatePublicMap(publicMap.id, {
        ...(configsChanged ? { dataSourceConfigs } : {}),
        ...(draftChanged ? { draft: newDraft } : {}),
      });
    }
  }
}

export function deletePublicMap(publicMapId: string) {
  return db
    .deleteFrom("publicMap")
    .where("id", "=", publicMapId)
    .returningAll()
    .executeTakeFirst();
}

export function unpublishPublicMap(publicMapId: string) {
  return db
    .updateTable("publicMap")
    .set({ published: false })
    .where("id", "=", publicMapId)
    .returningAll()
    .executeTakeFirst();
}
