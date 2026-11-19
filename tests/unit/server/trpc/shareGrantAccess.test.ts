import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { DataSourceRecordType, GeocodingType } from "@/models/DataSource";
import { MapAccessStatus } from "@/models/MapAccess";
import { MapStyleName } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import {
  findOrCreateMapAccess,
  setMapAccessStatus,
} from "@/server/repositories/MapAccess";
import {
  setMapShareEnabled,
  setMapShareModeratorEmails,
} from "@/server/repositories/MapShare";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { deleteUser, upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import { areaRouter } from "@/server/trpc/routers/area";
import { mapRouter } from "@/server/trpc/routers/map";
import { canReadDataSource } from "@/server/utils/auth";
import { storeTestCsv } from "../../../helpers/csv";
import type { ShareGrant } from "@/authTypes";
import type { MapAccess } from "@/models/MapAccess";
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
let accessA: MapAccess;
let markerDataSourceId: string;

const nowSeconds = () => Math.floor(Date.now() / 1000);

// A grant for share A's approved visitor
function grantFor(share: MapShare, iatOffsetSeconds = 0): ShareGrant {
  return {
    accessId: accessA.id,
    mapId: share.mapId,
    iat: nowSeconds() + iatOffsetSeconds,
  };
}

function makeMapCaller(shareGrants: ShareGrant[]) {
  return mapRouter.createCaller({
    user: null,
    ip: "127.0.0.1",
    grants: { share: shareGrants, publicMapAccess: [] },
  });
}

function makeAreaCaller(shareGrants: ShareGrant[]) {
  return areaRouter.createCaller({
    user: null,
    ip: "127.0.0.1",
    grants: { share: shareGrants, publicMapAccess: [] },
  });
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
      config: await storeTestCsv({
        fixture: "stats.csv",
        organisationId: orgId,
      }),
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

    await setMapShareModeratorEmails({
      mapId: mapAId,
      moderatorEmails: ["moderator@example.org"],
    });
    const enabled = await setMapShareEnabled({ mapId: mapAId, enabled: true });
    if (!enabled) {
      throw new Error("Share A was not created");
    }
    shareA = enabled;

    const { access } = await findOrCreateMapAccess({
      target: { kind: "mapShare", id: shareA.id },
      email: "visitor@example.org",
    });
    const approved = await setMapAccessStatus({
      id: access.id,
      fromStatus: MapAccessStatus.Pending,
      status: MapAccessStatus.Approved,
    });
    if (!approved) {
      throw new Error("Share A's visitor was not approved");
    }
    accessA = approved;
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

  test("a grant with an unknown accessId is rejected", async () => {
    const grant = { ...grantFor(shareA), accessId: randomUUID() };
    const caller = makeMapCaller([grant]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("a grant naming another map than its access row's share is rejected", async () => {
    const grant = { ...grantFor(shareA), mapId: mapBId };
    const caller = makeMapCaller([grant]);
    await expect(caller.byId({ mapId: mapBId })).rejects.toMatchObject({
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

  test("revoking access rejects grants; re-approving does not revive them", async () => {
    // Approved two minutes ago, so a grant minted a minute ago is valid
    // until the decisions below (decidedAt has second precision)
    await db
      .updateTable("mapAccess")
      .set({ decidedAt: new Date(Date.now() - 120_000) })
      .where("id", "=", accessA.id)
      .execute();
    const staleGrant = grantFor(shareA, -60);
    const staleCaller = makeMapCaller([staleGrant]);
    expect((await staleCaller.byId({ mapId: mapAId })).id).toBe(mapAId);

    await setMapAccessStatus({
      id: accessA.id,
      fromStatus: MapAccessStatus.Approved,
      status: MapAccessStatus.Revoked,
    });
    await expect(staleCaller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    await setMapAccessStatus({
      id: accessA.id,
      fromStatus: MapAccessStatus.Revoked,
      status: MapAccessStatus.Approved,
    });
    await expect(staleCaller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    // A grant minted after re-approval (from a new magic link) is accepted
    const freshCaller = makeMapCaller([grantFor(shareA, 5)]);
    expect((await freshCaller.byId({ mapId: mapAId })).id).toBe(mapAId);
  });

  test("a grant for a pending request is rejected", async () => {
    const { access: pending } = await findOrCreateMapAccess({
      target: { kind: "mapShare", id: shareA.id },
      email: "pending@example.org",
    });
    const caller = makeMapCaller([
      { accessId: pending.id, mapId: mapAId, iat: nowSeconds() },
    ]);
    await expect(caller.byId({ mapId: mapAId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
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
      grants: { share: [grantFor(shareA)], publicMapAccess: [] },
    });
    expect(canRead).toBe(true);
  });

  test("a grant unlocks a data source used as any view's areaDataSourceId", async () => {
    const canRead = await canReadDataSource({
      dataSource: { id: DS_AREA, public: false, organisationId: orgId },
      userId: null,
      grants: { share: [grantFor(shareA)], publicMapAccess: [] },
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
      grants: { share: [grantFor(shareA)], publicMapAccess: [] },
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
      grants: { share: [], publicMapAccess: [] },
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
