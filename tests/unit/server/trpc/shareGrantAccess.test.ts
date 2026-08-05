import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { MapStyleName } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import {
  setMapShareEnabled,
  setMapSharePassword,
  upsertMapShareForMap,
} from "@/server/repositories/MapShare";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { deleteUser, upsertUser } from "@/server/repositories/User";
import { areaRouter } from "@/server/trpc/routers/area";
import { mapRouter } from "@/server/trpc/routers/map";
import { canReadDataSource, hashPassword } from "@/server/utils/auth";
import type { ShareGrant } from "@/authTypes";
import type { MapShare } from "@/models/MapShare";

const userIds: string[] = [];
const mapIds: string[] = [];
const dataSourceIds: string[] = [];

// Data sources referenced only from map/view configs (no rows needed
// for canReadDataSource, which takes the data source object directly)
const DS_AREA = randomUUID();
const DS_ON_MAP_B_ONLY = randomUUID();

let orgId: string;
let mapAId: string;
let mapBId: string;
let shareA: MapShare;
let markerDataSourceId: string;

const nowSeconds = () => Math.floor(Date.now() / 1000);

function grantFor(share: MapShare, iatOffsetSeconds = 0): ShareGrant {
  return {
    shareId: share.id,
    mapId: share.mapId,
    iat: nowSeconds() + iatOffsetSeconds,
  };
}

function makeMapCaller(shareGrants: ShareGrant[]) {
  return mapRouter.createCaller({ user: null, ip: "127.0.0.1", shareGrants });
}

function makeAreaCaller(shareGrants: ShareGrant[]) {
  return areaRouter.createCaller({ user: null, ip: "127.0.0.1", shareGrants });
}

describe("share grant access control", () => {
  afterAll(async () => {
    for (const id of mapIds) {
      try {
        await deleteMap(id);
      } catch {
        // already deleted
      }
    }
    for (const id of dataSourceIds) {
      try {
        await deleteDataSource(id);
      } catch {
        // already deleted
      }
    }
    for (const id of userIds) {
      try {
        await deleteUser(id);
      } catch {
        // already deleted
      }
    }
  });

  test("setup: org, maps, share and data sources", async () => {
    const org = await upsertOrganisation({
      name: `ShareGrant Test Org ${uuidv4()}`,
    });
    orgId = org.id;

    const dataSource = await createDataSource({
      name: `ShareGrant Marker DS ${uuidv4()}`,
      organisationId: orgId,
      autoEnrich: false,
      autoImport: false,
      config: {
        type: DataSourceType.CSV,
        url: `file://tests/resources/stats.csv?${uuidv4()}`,
      },
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: ["Name"] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      public: false,
      recordType: DataSourceRecordType.Data,
    });
    dataSourceIds.push(dataSource.id);
    markerDataSourceId = dataSource.id;

    const mapA = await createMap(orgId, "ShareGrant Map A");
    mapAId = mapA.id;
    mapIds.push(mapA.id);
    await updateMap(mapA.id, {
      config: {
        markerDataSourceIds: [markerDataSourceId],
        membersDataSourceId: null,
      },
    });
    await upsertMapView({
      id: randomUUID(),
      mapId: mapA.id,
      name: "Test View",
      position: 0,
      config: {
        areaDataSourceId: DS_AREA,
        areaDataColumn: "",
        calculationType: CalculationType.Avg,
        mapStyleName: MapStyleName.Light,
        showLabels: false,
        showLocations: false,
        showMembers: false,
        showTurf: false,
      },
      dataSourceViews: [],
    });

    const mapB = await createMap(orgId, "ShareGrant Map B");
    mapBId = mapB.id;
    mapIds.push(mapB.id);
    await updateMap(mapB.id, {
      config: {
        markerDataSourceIds: [DS_ON_MAP_B_ONLY],
        membersDataSourceId: null,
      },
    });

    shareA = await upsertMapShareForMap(mapAId);
  });

  // ---------- mapReadProcedure (via map.byId) ----------

  test("anonymous caller without grants cannot read the map", async () => {
    const caller = makeMapCaller([]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("anonymous caller with a valid grant can read the map", async () => {
    const caller = makeMapCaller([grantFor(shareA)]);
    const result = await caller.byId({ mapId: mapAId });
    expect(result.id).toBe(mapAId);
    expect(Array.isArray(result.views)).toBe(true);
  });

  test("a grant does not unlock other maps", async () => {
    const caller = makeMapCaller([grantFor(shareA)]);
    await expect(caller.byId({ mapId: mapBId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("a grant with the wrong shareId is rejected", async () => {
    const grant = { ...grantFor(shareA), shareId: randomUUID() };
    const caller = makeMapCaller([grant]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("an aged-out grant is rejected", async () => {
    const eightDaysSeconds = 8 * 24 * 60 * 60;
    const caller = makeMapCaller([grantFor(shareA, -eightDaysSeconds)]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("disabling the share revokes existing grants immediately", async () => {
    const grant = grantFor(shareA);
    await setMapShareEnabled({ mapId: mapAId, enabled: false });

    const caller = makeMapCaller([grant]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    await setMapShareEnabled({ mapId: mapAId, enabled: true });
    const result = await caller.byId({ mapId: mapAId });
    expect(result.id).toBe(mapAId);
  });

  test("setting a password invalidates grants minted before the change", async () => {
    const staleGrant = grantFor(shareA, -60);
    await setMapSharePassword({
      mapId: mapAId,
      passwordHash: await hashPassword("view the map"),
    });

    const staleCaller = makeMapCaller([staleGrant]);
    await expect(staleCaller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    // A grant minted after the password change (i.e. after passing the
    // password check) is accepted
    const freshCaller = makeMapCaller([grantFor(shareA, 5)]);
    const result = await freshCaller.byId({ mapId: mapAId });
    expect(result.id).toBe(mapAId);

    // Removing the password restores link-only access for older grants
    await setMapSharePassword({ mapId: mapAId, passwordHash: null });
    const restored = await staleCaller.byId({ mapId: mapAId });
    expect(restored.id).toBe(mapAId);
  });

  // ---------- canReadDataSource ----------

  test("a grant unlocks a data source in the map's markerDataSourceIds", async () => {
    const canRead = await canReadDataSource({
      dataSource: {
        id: markerDataSourceId,
        public: false,
        organisationId: orgId,
      },
      userId: null,
      shareGrants: [grantFor(shareA)],
    });
    expect(canRead).toBe(true);
  });

  test("a grant unlocks a data source used as any view's areaDataSourceId", async () => {
    const canRead = await canReadDataSource({
      dataSource: { id: DS_AREA, public: false, organisationId: orgId },
      userId: null,
      shareGrants: [grantFor(shareA)],
    });
    expect(canRead).toBe(true);
  });

  test("a grant for map A does not unlock a data source only on map B", async () => {
    const canRead = await canReadDataSource({
      dataSource: {
        id: DS_ON_MAP_B_ONLY,
        public: false,
        organisationId: orgId,
      },
      userId: null,
      shareGrants: [grantFor(shareA)],
    });
    expect(canRead).toBe(false);
  });

  test("without grants an anonymous caller cannot read the data source", async () => {
    const canRead = await canReadDataSource({
      dataSource: {
        id: markerDataSourceId,
        public: false,
        organisationId: orgId,
      },
      userId: null,
      shareGrants: [],
    });
    expect(canRead).toBe(false);
  });

  // ---------- dataSourceReadProcedure passthrough (via area.stats) ----------

  test("area.stats accepts an anonymous caller with a valid grant", async () => {
    const caller = makeAreaCaller([grantFor(shareA)]);
    const result = await caller.stats({
      dataSourceId: markerDataSourceId,
      areaSetCode: null,
      calculationType: CalculationType.Avg,
      column: "",
    });
    expect(result).toBeNull();
  });

  test("area.stats rejects an anonymous caller without grants", async () => {
    const caller = makeAreaCaller([]);
    await expect(
      caller.stats({
        dataSourceId: markerDataSourceId,
        areaSetCode: null,
        calculationType: CalculationType.Avg,
        column: "",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  // ---------- viewerProcedure (via area.search / area.byCode) ----------

  test("area.search rejects an anonymous caller without grants", async () => {
    const caller = makeAreaCaller([]);
    await expect(caller.search({ search: "London" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("area.search accepts an anonymous caller with a valid grant", async () => {
    const caller = makeAreaCaller([grantFor(shareA)]);
    const result = await caller.search({ search: "London" });
    expect(Array.isArray(result)).toBe(true);
  });

  test("area.search rejects an anonymous caller whose grant is stale", async () => {
    await setMapShareEnabled({ mapId: mapAId, enabled: false });
    const caller = makeAreaCaller([grantFor(shareA)]);
    await expect(caller.search({ search: "London" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await setMapShareEnabled({ mapId: mapAId, enabled: true });
  });

  test("area.search still works for authenticated users", async () => {
    const user = await upsertUser({
      email: `test-${uuidv4()}@example.com`,
      password: "test-password-123",
      name: "Test User",
      avatarUrl: null,
    });
    userIds.push(user.id);

    const caller = areaRouter.createCaller({ user, ip: "127.0.0.1" });
    const result = await caller.search({ search: "London" });
    expect(Array.isArray(result)).toBe(true);
  });
});
