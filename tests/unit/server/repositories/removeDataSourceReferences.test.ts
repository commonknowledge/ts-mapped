import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";
import { FilterType, MapStyleName } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import {
  createMap,
  deleteMap,
  findMapById,
  removeDataSourceFromMaps,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewById,
  removeDataSourceFromMapViews,
  upsertMapView,
} from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import {
  applyDraft,
  findPublicMapByViewId,
  removeDataSourceFromPublicMaps,
  saveDraft,
} from "@/server/repositories/PublicMap";

// The data source that gets "deleted" and should be purged everywhere.
const DS_DELETED = randomUUID();
// A second data source that must be left untouched.
const DS_KEPT = randomUUID();

let orgId: string;
let mapId: string;
let viewId: string;
const publicMapId = randomUUID();

const baseViewConfig = {
  areaDataSourceId: "",
  areaDataColumn: "",
  calculationType: CalculationType.Avg,
  mapStyleName: MapStyleName.Light,
  showBoundaryOutline: false,
  showLabels: false,
  showLocations: false,
  showMembers: false,
  showTurf: false,
};

const makeDataSourceView = (dataSourceId: string) => ({
  dataSourceId,
  filter: { type: FilterType.EMPTY },
  search: "",
  sort: [],
});

const makeDraft = (dataSourceIds: string[]) => ({
  host: "",
  name: "Test Public Map",
  description: "",
  descriptionLong: "",
  descriptionLink: "",
  imageUrl: "",
  published: true,
  colorScheme: "red",
  dataSourceConfigs: dataSourceIds.map((id) => ({
    allowUserEdit: false,
    allowUserSubmit: false,
    dataSourceId: id,
    dataSourceLabel: "Test",
    formUrl: "",
    editFormUrl: "",
    nameColumns: [],
    nameLabel: "",
    descriptionColumn: "",
    descriptionLabel: "",
    additionalColumns: [],
  })),
});

describe("removeDataSource* reference cleanup", () => {
  afterAll(async () => {
    // Deleting the map cascades to mapView and publicMap
    if (mapId) await deleteMap(mapId);
  });

  test("setup: org, map, view and public map referencing both data sources", async () => {
    const org = await upsertOrganisation({ name: "Remove DS Refs Test Org" });
    orgId = org.id;

    const map = await createMap(orgId, "Remove DS Refs Test Map");
    mapId = map.id;
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [DS_DELETED, DS_KEPT],
        membersDataSourceId: DS_DELETED,
      },
    });

    viewId = randomUUID();
    await upsertMapView({
      id: viewId,
      mapId,
      name: "Test View",
      position: 0,
      config: { ...baseViewConfig, areaDataSourceId: DS_DELETED },
      dataSourceViews: [
        makeDataSourceView(DS_DELETED),
        makeDataSourceView(DS_KEPT),
      ],
    });

    // Publish live configs, then add a draft so both layers are exercised.
    await applyDraft({
      id: publicMapId,
      mapId,
      viewId,
      draft: makeDraft([DS_DELETED, DS_KEPT]),
    });
    await saveDraft({
      id: publicMapId,
      mapId,
      viewId,
      draft: makeDraft([DS_DELETED, DS_KEPT]),
    });
  });

  test("purges the deleted data source from map config, keeping the other", async () => {
    await removeDataSourceFromMaps({
      organisationId: orgId,
      dataSourceId: DS_DELETED,
    });

    const map = await findMapById(mapId);
    expect(map?.config.markerDataSourceIds).toEqual([DS_KEPT]);
    expect(map?.config.membersDataSourceId).toBe("");
  });

  test("purges the deleted data source from map views", async () => {
    await removeDataSourceFromMapViews({
      organisationId: orgId,
      dataSourceId: DS_DELETED,
    });

    const view = await findMapViewById(viewId);
    expect(view?.dataSourceViews.map((dsv) => dsv.dataSourceId)).toEqual([
      DS_KEPT,
    ]);
    expect(view?.config.areaDataSourceId).toBe("");
  });

  test("purges the deleted data source from public map configs and draft", async () => {
    await removeDataSourceFromPublicMaps({
      organisationId: orgId,
      dataSourceId: DS_DELETED,
    });

    const publicMap = await findPublicMapByViewId(viewId);
    expect(publicMap?.dataSourceConfigs.map((c) => c.dataSourceId)).toEqual([
      DS_KEPT,
    ]);
    expect(
      publicMap?.draft?.dataSourceConfigs.map((c) => c.dataSourceId),
    ).toEqual([DS_KEPT]);
  });
});
