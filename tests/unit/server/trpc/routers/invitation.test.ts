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
  findDataSourceById,
} from "@/server/repositories/DataSource";
import { findPendingInvitationsByEmail } from "@/server/repositories/Invitation";
import {
  createMap,
  deleteMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import { findMapViewsByMapId } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import {
  deleteUser,
  findUserById,
  updateUserRole,
  upsertUser,
} from "@/server/repositories/User";
import { db } from "@/server/services/database";
import { invitationRouter } from "@/server/trpc/routers/invitation";

const userIds: string[] = [];
const mapIds: string[] = [];
const dataSourceIds: string[] = [];

async function createSenderOrg() {
  return upsertOrganisation({ name: `Sender Org ${uuidv4()}` });
}

async function createTestUser(role?: UserRole | null, organisationId?: string) {
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
    if (organisationId) {
      await upsertOrganisationUser({
        organisationId,
        userId: updated.id,
      });
    }
    return updated;
  }
  return user;
}

function makeCaller(user: Awaited<ReturnType<typeof createTestUser>> | null) {
  return invitationRouter.createCaller({ user, ip: "127.0.0.1" });
}

describe("invitation.list", () => {
  test("superadmin can list invitations", async () => {
    const senderOrg = await createSenderOrg();
    const superadmin = await createTestUser(UserRole.Superadmin, senderOrg.id);
    const caller = makeCaller(superadmin);

    const result = await caller.list({ senderOrganisationId: senderOrg.id });
    expect(Array.isArray(result)).toBe(true);
  });

  test("advocate can list invitations", async () => {
    const senderOrg = await createSenderOrg();
    const advocate = await createTestUser(UserRole.Advocate, senderOrg.id);
    const caller = makeCaller(advocate);

    const result = await caller.list({ senderOrganisationId: senderOrg.id });
    expect(Array.isArray(result)).toBe(true);
  });

  test("regular user cannot list invitations", async () => {
    const senderOrg = await createSenderOrg();
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(
      caller.list({ senderOrganisationId: senderOrg.id }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("only returns invitations from the requested sender organisation", async () => {
    const orgA = await createSenderOrg();
    const orgB = await createSenderOrg();

    const superadmin = await createTestUser(UserRole.Superadmin, orgA.id);
    await upsertOrganisationUser({
      organisationId: orgB.id,
      userId: superadmin.id,
    });

    const caller = makeCaller(superadmin);

    // Create invitations under orgA
    const emailA1 = `invitee-${uuidv4()}@example.com`;
    const emailA2 = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee A1",
      email: emailA1,
      senderOrganisationId: orgA.id,
      organisationName: `Target Org ${uuidv4()}`,
    });
    await caller.create({
      name: "Invitee A2",
      email: emailA2,
      senderOrganisationId: orgA.id,
      organisationName: `Target Org ${uuidv4()}`,
    });

    // Create invitation under orgB
    const emailB = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee B",
      email: emailB,
      senderOrganisationId: orgB.id,
      organisationName: `Target Org ${uuidv4()}`,
    });

    // List for orgA should only contain orgA's invitations
    const resultA = await caller.list({ senderOrganisationId: orgA.id });
    const emailsA = resultA.map((inv) => inv.email);
    expect(emailsA).toContain(emailA1);
    expect(emailsA).toContain(emailA2);
    expect(emailsA).not.toContain(emailB);

    // List for orgB should only contain orgB's invitation
    const resultB = await caller.list({ senderOrganisationId: orgB.id });
    const emailsB = resultB.map((inv) => inv.email);
    expect(emailsB).toContain(emailB);
    expect(emailsB).not.toContain(emailA1);
    expect(emailsB).not.toContain(emailA2);
  });

  test("unauthenticated user cannot list invitations", async () => {
    const senderOrg = await createSenderOrg();
    const caller = makeCaller(null);

    await expect(
      caller.list({ senderOrganisationId: senderOrg.id }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("invitation.create", () => {
  test("advocate can create an invitation with a new organisation", async () => {
    const senderOrg = await createSenderOrg();
    const advocate = await createTestUser(UserRole.Advocate, senderOrg.id);
    const caller = makeCaller(advocate);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
    });

    const pending = await findPendingInvitationsByEmail(email);
    expect(pending.length).toBe(1);
    expect(pending[0].name).toBe("Invitee");
  });

  test("superadmin can create an invitation with a new organisation", async () => {
    const senderOrg = await createSenderOrg();
    const superadmin = await createTestUser(UserRole.Superadmin, senderOrg.id);
    const caller = makeCaller(superadmin);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
    });

    const pending = await findPendingInvitationsByEmail(email);
    expect(pending.length).toBe(1);
  });

  test("advocate can create an invitation with mapSelections (copies the map + DS)", async () => {
    const senderOrg = await createSenderOrg();
    const advocate = await createTestUser(UserRole.Advocate, senderOrg.id);
    const caller = makeCaller(advocate);

    const sourceOrg = await upsertOrganisation({
      name: `Src Org ${uuidv4()}`,
    });
    const sourceDs = await createDataSource({
      name: "Src DS",
      organisationId: sourceOrg.id,
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
    dataSourceIds.push(sourceDs.id);

    const sourceMap = await createMap(sourceOrg.id, "Map To Copy");
    mapIds.push(sourceMap.id);
    await updateMap(sourceMap.id, {
      config: {
        markerDataSourceIds: [sourceDs.id],
        membersDataSourceId: null,
      },
    });

    const email = `invitee-${uuidv4()}@example.com`;
    const targetOrgName = `Target Org ${uuidv4()}`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: targetOrgName,
      mapSelections: [{ mapId: sourceMap.id, dataSourceIds: [sourceDs.id] }],
    });

    const pending = await findPendingInvitationsByEmail(email);
    expect(pending.length).toBe(1);
    const targetOrgId = pending[0].organisationId;
    expect(targetOrgId).toBeTruthy();
    if (!targetOrgId) return;

    const targetMaps = await findMapsByOrganisationId(targetOrgId);
    expect(targetMaps.length).toBe(1);
    expect(targetMaps[0].name).toBe("Map To Copy");
    mapIds.push(targetMaps[0].id);

    const copiedDsIds = targetMaps[0].config.markerDataSourceIds;
    expect(copiedDsIds.length).toBe(1);
    expect(copiedDsIds[0]).not.toBe(sourceDs.id);
    dataSourceIds.push(copiedDsIds[0]);

    const copiedDs = await findDataSourceById(copiedDsIds[0]);
    expect(copiedDs?.organisationId).toBe(targetOrgId);

    // ensureOrganisationMap would have created an additional default map —
    // confirm only the copied map exists in the new org
    const views = await findMapViewsByMapId(targetMaps[0].id);
    expect(Array.isArray(views)).toBe(true);
  });

  test("regular user cannot create invitations", async () => {
    const senderOrg = await createSenderOrg();
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(
      caller.create({
        name: "Test",
        email: "test@example.com",
        senderOrganisationId: senderOrg.id,
        organisationName: "Test Org",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("unauthenticated user cannot create invitations", async () => {
    const senderOrg = await createSenderOrg();
    const caller = makeCaller(null);

    await expect(
      caller.create({
        name: "Test",
        email: "test@example.com",
        senderOrganisationId: senderOrg.id,
        organisationName: "Test Org",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("invitation.create isTrial", () => {
  test("advocate invitation is marked as trial with default trial days", async () => {
    const senderOrg = await createSenderOrg();
    const advocate = await createTestUser(UserRole.Advocate, senderOrg.id);
    const caller = makeCaller(advocate);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
    });

    const invitation = await db
      .selectFrom("invitation")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirstOrThrow();
    expect(invitation.isTrial).toBe(true);
    expect(invitation.trialDays).toBe(30);
  });

  test("superadmin invitation is not marked as trial by default", async () => {
    const senderOrg = await createSenderOrg();
    const superadmin = await createTestUser(UserRole.Superadmin, senderOrg.id);
    const caller = makeCaller(superadmin);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
    });

    const invitation = await db
      .selectFrom("invitation")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirstOrThrow();
    expect(invitation.isTrial).toBe(false);
    expect(invitation.trialDays).toBeNull();
  });

  test("superadmin can create a trial invitation with custom days", async () => {
    const senderOrg = await createSenderOrg();
    const superadmin = await createTestUser(UserRole.Superadmin, senderOrg.id);
    const caller = makeCaller(superadmin);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
      isTrial: true,
      trialDays: 14,
    });

    const invitation = await db
      .selectFrom("invitation")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirstOrThrow();
    expect(invitation.isTrial).toBe(true);
    expect(invitation.trialDays).toBe(14);
  });

  test("superadmin trial invitation defaults to 30 days", async () => {
    const senderOrg = await createSenderOrg();
    const superadmin = await createTestUser(UserRole.Superadmin, senderOrg.id);
    const caller = makeCaller(superadmin);

    const email = `invitee-${uuidv4()}@example.com`;
    await caller.create({
      name: "Invitee",
      email,
      senderOrganisationId: senderOrg.id,
      organisationName: `New Org ${uuidv4()}`,
      isTrial: true,
    });

    const invitation = await db
      .selectFrom("invitation")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirstOrThrow();
    expect(invitation.isTrial).toBe(true);
    expect(invitation.trialDays).toBe(30);
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
