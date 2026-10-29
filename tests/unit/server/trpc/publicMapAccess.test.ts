import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { MapStyleName } from "@/models/MapView";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { CalculationType } from "@/models/shared";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { applyDraft } from "@/server/repositories/PublicMap";
import {
  findOrCreatePublicMapAccess,
  setPublicMapAccessStatus,
} from "@/server/repositories/PublicMapAccess";
import { mapRouter } from "@/server/trpc/routers/map";
import { publicMapRouter } from "@/server/trpc/routers/publicMap";
import { canReadDataSource } from "@/server/utils/auth";
import type { PublicMapAccessGrant, VisitorGrants } from "@/authTypes";
import type { PublicMapDraft } from "@/models/PublicMap";
import type { PublicMapAccess } from "@/models/PublicMapAccess";

const mapIds: string[] = [];

// Data sources referenced only from map/view and public map configs (no rows
// needed for canReadDataSource, which takes the data source object directly)
const DS_MODERATED_ONLY = randomUUID();
const DS_ON_BOTH = randomUUID();

let orgId: string;
let moderatedMapId: string;
let moderatedViewId: string;
let moderatedPublicMapId: string;
let openMapId: string;
let access: PublicMapAccess;

const nowSeconds = () => Math.floor(Date.now() / 1000);

function grantFor(
  row: PublicMapAccess,
  iatOffsetSeconds = 0,
): PublicMapAccessGrant {
  return {
    accessId: row.id,
    publicMapId: row.publicMapId,
    iat: nowSeconds() + iatOffsetSeconds,
  };
}

const visitor = (publicMapAccess: PublicMapAccessGrant[]): VisitorGrants => ({
  share: [],
  publicMapAccess,
});

const makeMapCaller = (publicMapAccess: PublicMapAccessGrant[]) =>
  mapRouter.createCaller({
    user: null,
    ip: "127.0.0.1",
    grants: visitor(publicMapAccess),
  });

const makePublicMapCaller = (publicMapAccess: PublicMapAccessGrant[]) =>
  publicMapRouter.createCaller({
    user: null,
    ip: "127.0.0.1",
    grants: visitor(publicMapAccess),
  });

const canRead = (dataSourceId: string, grants: PublicMapAccessGrant[]) =>
  canReadDataSource({
    dataSource: { id: dataSourceId, public: false, organisationId: orgId },
    userId: null,
    grants: visitor(grants),
  });

const makeDraft = ({
  accessMode,
  dataSourceIds,
}: {
  accessMode: PublicMapAccessMode;
  dataSourceIds: string[];
}): PublicMapDraft => ({
  host: "",
  name: "Moderated Test Public Map",
  description: "A description visitors may see",
  descriptionLong: "",
  descriptionLink: "",
  imageUrl: "",
  published: true,
  colorScheme: "red",
  clusteringEnabled: true,
  accessMode,
  moderatorEmails:
    accessMode === PublicMapAccessMode.Moderated
      ? ["moderator@example.org"]
      : [],
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
});

async function createPublishedMap({
  name,
  accessMode,
  dataSourceIds,
}: {
  name: string;
  accessMode: PublicMapAccessMode;
  dataSourceIds: string[];
}) {
  const map = await createMap(orgId, name);
  mapIds.push(map.id);
  await updateMap(map.id, {
    config: { markerDataSourceIds: dataSourceIds, membersDataSourceId: null },
  });
  const viewId = randomUUID();
  await upsertMapView({
    id: viewId,
    mapId: map.id,
    name: "Test View",
    position: 0,
    config: {
      areaDataSourceId: "",
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
  const publicMap = await applyDraft({
    id: randomUUID(),
    mapId: map.id,
    viewId,
    draft: makeDraft({ accessMode, dataSourceIds }),
  });
  return { mapId: map.id, viewId, publicMapId: publicMap.id };
}

describe("moderated public map access control", () => {
  afterAll(async () => {
    // Deleting a map cascades to its views, public map and access rows
    for (const id of mapIds) {
      try {
        await deleteMap(id);
      } catch {
        // already deleted
      }
    }
  });

  test("setup: a moderated and an open public map sharing a data source", async () => {
    const org = await upsertOrganisation({
      name: `PublicMapAccess Test Org ${uuidv4()}`,
    });
    orgId = org.id;

    const moderated = await createPublishedMap({
      name: "Moderated Map",
      accessMode: PublicMapAccessMode.Moderated,
      dataSourceIds: [DS_MODERATED_ONLY, DS_ON_BOTH],
    });
    moderatedMapId = moderated.mapId;
    moderatedViewId = moderated.viewId;
    moderatedPublicMapId = moderated.publicMapId;

    const open = await createPublishedMap({
      name: "Open Map",
      accessMode: PublicMapAccessMode.Open,
      dataSourceIds: [DS_ON_BOTH],
    });
    openMapId = open.mapId;

    const { access: created } = await findOrCreatePublicMapAccess({
      publicMapId: moderatedPublicMapId,
      email: "Visitor@Example.org",
    });
    access = created;
  });

  // ---------- without a grant ----------

  test("publicMap.get withholds a moderated map's data without a grant", async () => {
    const result = await makePublicMapCaller([]).get({
      viewId: moderatedViewId,
    });
    expect(result?.accessGranted).toBe(false);
    expect(result?.name).toBe("Moderated Test Public Map");
    expect(result?.description).toBe("A description visitors may see");
    expect(result?.dataSourceConfigs).toEqual([]);
    expect(result?.moderatorEmails).toEqual([]);
    expect(result?.draft).toBeNull();
  });

  test("map.byId rejects a moderated map without a grant", async () => {
    await expect(
      makeMapCaller([]).byId({ mapId: moderatedMapId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("an open public map is still readable without a grant", async () => {
    const result = await makeMapCaller([]).byId({ mapId: openMapId });
    expect(result.id).toBe(openMapId);
  });

  test("a data source only on the moderated map is not readable without a grant", async () => {
    expect(await canRead(DS_MODERATED_ONLY, [])).toBe(false);
  });

  test("a data source on both an open and a moderated map is readable via the open one", async () => {
    expect(await canRead(DS_ON_BOTH, [])).toBe(true);
  });

  // ---------- pending ----------

  test("requests are stored with a lowercased email", () => {
    expect(access.email).toBe("visitor@example.org");
    expect(access.status).toBe(PublicMapAccessStatus.Pending);
  });

  test("a repeat request returns the existing row", async () => {
    const repeat = await findOrCreatePublicMapAccess({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    expect(repeat.created).toBe(false);
    expect(repeat.access.id).toBe(access.id);
  });

  test("a grant for a pending request is rejected", async () => {
    await expect(
      makeMapCaller([grantFor(access)]).byId({ mapId: moderatedMapId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  // ---------- approved ----------

  test("once approved, a grant unlocks the map, its data and its config", async () => {
    await setPublicMapAccessStatus({
      id: access.id,
      status: PublicMapAccessStatus.Approved,
    });
    const grants = [grantFor(access)];

    const map = await makeMapCaller(grants).byId({ mapId: moderatedMapId });
    expect(map.id).toBe(moderatedMapId);

    expect(await canRead(DS_MODERATED_ONLY, grants)).toBe(true);

    const publicMap = await makePublicMapCaller(grants).get({
      viewId: moderatedViewId,
    });
    expect(publicMap?.accessGranted).toBe(true);
    expect(publicMap?.dataSourceConfigs).toHaveLength(2);
    // Moderators stay hidden from visitors, even approved ones
    expect(publicMap?.moderatorEmails).toEqual([]);
  });

  test("a grant minted before the approval is rejected", async () => {
    await expect(
      makeMapCaller([grantFor(access, -60)]).byId({ mapId: moderatedMapId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("an aged-out grant is rejected", async () => {
    const eightDaysSeconds = 8 * 24 * 60 * 60;
    const grant = grantFor(access, -eightDaysSeconds);
    expect(await canRead(DS_MODERATED_ONLY, [grant])).toBe(false);
  });

  test("a grant naming a different public map is rejected", async () => {
    const grant = { ...grantFor(access), publicMapId: randomUUID() };
    expect(await canRead(DS_MODERATED_ONLY, [grant])).toBe(false);
  });

  test("a grant for an unknown access row is rejected", async () => {
    const grant = { ...grantFor(access), accessId: randomUUID() };
    expect(await canRead(DS_MODERATED_ONLY, [grant])).toBe(false);
  });

  // ---------- revoked ----------

  test("revoking access invalidates existing grants immediately", async () => {
    const grant = grantFor(access);
    await setPublicMapAccessStatus({
      id: access.id,
      status: PublicMapAccessStatus.Revoked,
    });
    await expect(
      makeMapCaller([grant]).byId({ mapId: moderatedMapId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(await canRead(DS_MODERATED_ONLY, [grant])).toBe(false);
  });

  test("re-approving does not revive grants from before the revocation", async () => {
    const oldGrant = grantFor(access, -60);
    await setPublicMapAccessStatus({
      id: access.id,
      status: PublicMapAccessStatus.Approved,
    });
    expect(await canRead(DS_MODERATED_ONLY, [oldGrant])).toBe(false);
    expect(await canRead(DS_MODERATED_ONLY, [grantFor(access)])).toBe(true);
  });
});
