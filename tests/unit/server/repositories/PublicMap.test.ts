import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";
import { MapStyleName } from "@/models/MapView";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { CalculationType } from "@/models/shared";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import {
  applyDraft,
  findPublishedPublicMapsByDataSourceId,
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
  calculationType: CalculationType.Avg,
  mapStyleName: MapStyleName.Light,
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
    clusteringEnabled: true,
    accessMode: PublicMapAccessMode.Open,
    moderatorEmails: [],
    embedUrl: "",
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

describe("findPublishedPublicMapsByDataSourceId", () => {
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

    const result = await findPublishedPublicMapsByDataSourceId(DS_MEMBERS);
    expect(result).toHaveLength(1);
    expect(result[0].mapId).toBe(mapId);
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

    const result = await findPublishedPublicMapsByDataSourceId(DS_MARKERS);
    expect(result).toHaveLength(1);
    expect(result[0].mapId).toBe(mapId);
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

    const result = await findPublishedPublicMapsByDataSourceId(DS_AREA);
    expect(result).toHaveLength(1);
    expect(result[0].mapId).toBe(mapId);
  });

  // ---------- negative: in dataSourceConfigs but NOT on map/view ----------
  test("returns nothing when dataSource is only in dataSourceConfigs but not on map or view", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, "");
    await publishPublicMap(mapId, viewId, [DS_ONLY_IN_CONFIG]);

    const result =
      await findPublishedPublicMapsByDataSourceId(DS_ONLY_IN_CONFIG);
    expect(result).toEqual([]);
  });

  // ---------- negative: on map but NOT in dataSourceConfigs ----------
  test("returns nothing when dataSource is on map but not in dataSourceConfigs", async () => {
    await updateMap(mapId, {
      config: {
        markerDataSourceIds: [DS_ONLY_ON_MAP],
        membersDataSourceId: "",
      },
    });

    const viewId = await createView(mapId, "");
    // Published with an empty dataSourceConfigs list
    await publishPublicMap(mapId, viewId, []);

    const result = await findPublishedPublicMapsByDataSourceId(DS_ONLY_ON_MAP);
    expect(result).toEqual([]);
  });

  // ---------- negative: completely unknown dataSource ----------
  test("returns nothing for a dataSource that does not exist anywhere", async () => {
    const result = await findPublishedPublicMapsByDataSourceId(DS_NONEXISTENT);
    expect(result).toEqual([]);
  });

  // ---------- SQL injection ----------
  test("does not allow SQL injection via dataSourceId", async () => {
    const malicious = "'; DROP TABLE public_map; --";
    const result = await findPublishedPublicMapsByDataSourceId(malicious);
    expect(result).toEqual([]);
  });

  test("does not allow SQL injection via JSON payload in dataSourceId", async () => {
    const malicious = "\"}]'::jsonb; DROP TABLE public_map; --";
    const result = await findPublishedPublicMapsByDataSourceId(malicious);
    expect(result).toEqual([]);
  });
});
