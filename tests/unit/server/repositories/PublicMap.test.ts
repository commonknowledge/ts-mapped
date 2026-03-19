import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";
import { MapStyleName } from "@/server/models/MapView";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import {
  applyDraft,
  findPublishedPublicMapByDataSourceId,
} from "@/server/repositories/PublicMap";

// Shared test state
let orgId: string;
let mapId: string;

const mapViewIds: string[] = [];

const DS_MEMBERS = randomUUID();
const DS_MARKERS = randomUUID();
const DS_AREA = randomUUID();
const DS_ONLY_IN_CONFIG = randomUUID();
const DS_ONLY_ON_MAP = randomUUID();
const DS_NONEXISTENT = randomUUID();

// Minimal valid MapViewConfig
const baseViewConfig = {
  areaDataSourceId: "",
  areaDataColumn: "",
  mapStyleName: MapStyleName.Light,
  showBoundaryOutline: false,
  showLabels: false,
  showLocations: false,
  showMembers: false,
  showTurf: false,
};

function makeDraft(dataSourceIds: string[]) {
  return {
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
  };
}

async function createView(
  viewMapId: string,
  areaDataSourceId: string,
): Promise<string> {
  const id = randomUUID();
  mapViewIds.push(id);
  await upsertMapView({
    id,
    mapId: viewMapId,
    name: "Test View",
    position: 0,
    config: { ...baseViewConfig, areaDataSourceId },
    dataSourceViews: [],
  });
  return id;
}

async function publishPublicMap(
  pmMapId: string,
  viewId: string,
  dataSourceIds: string[],
) {
  await applyDraft({
    id: randomUUID(),
    mapId: pmMapId,
    viewId,
    draft: makeDraft(dataSourceIds),
  });
}

describe("findPublishedPublicMapByDataSourceId", () => {
  // ---------- setup ----------
  afterAll(async () => {
    // Deleting the map cascades to mapView and publicMap
    if (mapId) await deleteMap(mapId);
  });

  test("setup: create shared org and map", async () => {
    const org = await upsertOrganisation({
      name: "PublicMap Test Org",
    });
    orgId = org.id;

    const map = await createMap(orgId, "PublicMap Test Map");
    mapId = map.id;
  });

  // ---------- membersDataSourceId ----------
  test("finds public map when dataSource is in membersDataSourceId", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [],
        membersDataSourceId: DS_MEMBERS,
      },
    });

    const viewId = await createView(mapId, "");
    await publishPublicMap(mapId, viewId, [DS_MEMBERS]);

    const result = await findPublishedPublicMapByDataSourceId(DS_MEMBERS);
    expect(result).toBeDefined();
    expect(result?.mapId).toBe(mapId);
  });

  // ---------- markerDataSourceIds ----------
  test("finds public map when dataSource is in markerDataSourceIds", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [DS_MARKERS],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, "");
    await publishPublicMap(mapId, viewId, [DS_MARKERS]);

    const result = await findPublishedPublicMapByDataSourceId(DS_MARKERS);
    expect(result).toBeDefined();
    expect(result?.mapId).toBe(mapId);
  });

  // ---------- areaDataSourceId ----------
  test("finds public map when dataSource is in view areaDataSourceId", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, DS_AREA);
    await publishPublicMap(mapId, viewId, [DS_AREA]);

    const result = await findPublishedPublicMapByDataSourceId(DS_AREA);
    expect(result).toBeDefined();
    expect(result?.mapId).toBe(mapId);
  });

  // ---------- negative: in dataSourceConfigs but NOT on map/view ----------
  test("returns undefined when dataSource is only in dataSourceConfigs but not on map or view", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, "");
    await publishPublicMap(mapId, viewId, [DS_ONLY_IN_CONFIG]);

    const result =
      await findPublishedPublicMapByDataSourceId(DS_ONLY_IN_CONFIG);
    expect(result).toBeUndefined();
  });

  // ---------- negative: on map but NOT in dataSourceConfigs ----------
  test("returns undefined when dataSource is on map but not in dataSourceConfigs", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [DS_ONLY_ON_MAP],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, "");
    // Published with an empty dataSourceConfigs list
    await publishPublicMap(mapId, viewId, []);

    const result = await findPublishedPublicMapByDataSourceId(DS_ONLY_ON_MAP);
    expect(result).toBeUndefined();
  });

  // ---------- negative: completely unknown dataSource ----------
  test("returns undefined for a dataSource that does not exist anywhere", async () => {
    const result = await findPublishedPublicMapByDataSourceId(DS_NONEXISTENT);
    expect(result).toBeUndefined();
  });

  // ---------- SQL injection ----------
  test("does not allow SQL injection via dataSourceId", async () => {
    const malicious = "'; DROP TABLE public_map; --";
    const result = await findPublishedPublicMapByDataSourceId(malicious);
    expect(result).toBeUndefined();
  });

  test("does not allow SQL injection via JSON payload in dataSourceId", async () => {
    const malicious = "\"}]'::jsonb; DROP TABLE public_map; --";
    const result = await findPublishedPublicMapByDataSourceId(malicious);
    expect(result).toBeUndefined();
  });
});
