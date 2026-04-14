import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import { UserRole } from "@/models/User";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { createMap, deleteMap, updateMap } from "@/server/repositories/Map";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import {
  deleteUser,
  findUserById,
  updateUserRole,
  upsertUser,
} from "@/server/repositories/User";
import { mapRouter } from "@/server/trpc/routers/map";

const userIds: string[] = [];
const mapIds: string[] = [];
const dataSourceIds: string[] = [];

async function createTestUser(role?: UserRole | null) {
  const user = await upsertUser({
    email: `test-${uuidv4()}@example.com`,
    password: "test-password-123",
    name: "Test User",
    avatarUrl: null,
  });
  userIds.push(user.id);
  if (role) {
    await updateUserRole(user.id, role);
    const updated = await findUserById(user.id);
    if (!updated) throw new Error("User not found after role update");
    return updated;
  }
  return user;
}

function makeCaller(user: Awaited<ReturnType<typeof createTestUser>> | null) {
  return mapRouter.createCaller({ user, ip: "127.0.0.1" });
}

describe("map.listAll", () => {
  test("regular user cannot list all maps", async () => {
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(caller.listAll()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("unauthenticated user cannot list all maps", async () => {
    const caller = makeCaller(null);

    await expect(caller.listAll()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("advocate can list all maps and response includes views and dataSourceNames", async () => {
    const advocate = await createTestUser(UserRole.Advocate);
    const caller = makeCaller(advocate);

    const org = await upsertOrganisation({ name: `ListAll Org ${uuidv4()}` });
    const ds = await createDataSource({
      name: `Marker DS ${uuidv4()}`,
      organisationId: org.id,
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
    dataSourceIds.push(ds.id);

    const map = await createMap(org.id, `ListAll Map ${uuidv4()}`);
    mapIds.push(map.id);
    await updateMap(map.id, {
      config: {
        markerDataSourceIds: [ds.id],
        membersDataSourceId: null,
      },
    });

    const result = await caller.listAll();
    expect(Array.isArray(result.maps)).toBe(true);
    const ours = result.maps.find((m) => m.id === map.id);
    expect(ours).toBeDefined();
    if (!ours) return;
    expect(Array.isArray(ours.views)).toBe(true);
    expect(ours.config.markerDataSourceIds).toContain(ds.id);
    expect(result.dataSourceNames[ds.id]).toBe(ds.name);
  });

  test("superadmin can list all maps", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const caller = makeCaller(superadmin);

    const result = await caller.listAll();
    expect(Array.isArray(result.maps)).toBe(true);
    expect(typeof result.dataSourceNames).toBe("object");
  });
});

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
