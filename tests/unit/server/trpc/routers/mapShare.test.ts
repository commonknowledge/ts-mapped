import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { createMap, deleteMap } from "@/server/repositories/Map";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { deleteUser, upsertUser } from "@/server/repositories/User";
import { mapShareRouter } from "@/server/trpc/routers/mapShare";

const userIds: string[] = [];
const mapIds: string[] = [];

async function createTestUser() {
  const user = await upsertUser({
    email: `test-${uuidv4()}@example.com`,
    password: "test-password-123",
    name: "Test User",
    avatarUrl: null,
  });
  userIds.push(user.id);
  return user;
}

function makeCaller(user: Awaited<ReturnType<typeof createTestUser>> | null) {
  return mapShareRouter.createCaller({ user, ip: "127.0.0.1" });
}

let mapId: string;
let member: Awaited<ReturnType<typeof createTestUser>>;
let outsider: Awaited<ReturnType<typeof createTestUser>>;

describe("mapShare router", () => {
  afterAll(async () => {
    for (const id of mapIds) {
      try {
        await deleteMap(id);
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

  test("setup: create org, member, outsider and map", async () => {
    const org = await upsertOrganisation({
      name: `MapShare Router Org ${uuidv4()}`,
    });
    member = await createTestUser();
    outsider = await createTestUser();
    await upsertOrganisationUser({
      organisationId: org.id,
      userId: member.id,
    });

    const map = await createMap(org.id, "MapShare Router Test Map");
    mapId = map.id;
    mapIds.push(map.id);
  });

  test("unauthenticated user cannot read or manage the share", async () => {
    const caller = makeCaller(null);

    await expect(caller.get({ mapId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.enable({ mapId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("non-member cannot read or manage the share", async () => {
    const caller = makeCaller(outsider);

    await expect(caller.get({ mapId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller.enable({ mapId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("get returns null before sharing is enabled", async () => {
    const caller = makeCaller(member);
    const share = await caller.get({ mapId });
    expect(share).toBeNull();
  });

  test("disable fails before there is a share", async () => {
    const caller = makeCaller(member);

    await expect(caller.disable({ mapId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("sharing can't be enabled without a moderator", async () => {
    const caller = makeCaller(member);

    await expect(caller.enable({ mapId })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("setting moderators creates a disabled share, lowercased and deduplicated", async () => {
    const caller = makeCaller(member);
    const share = await caller.setModeratorEmails({
      mapId,
      moderatorEmails: ["Moderator@Example.org", "moderator@example.org"],
    });

    expect(share.enabled).toBe(false);
    expect(share.moderatorEmails).toEqual(["moderator@example.org"]);
    expect(share.token).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  test("moderator emails must be valid", async () => {
    const caller = makeCaller(member);
    await expect(
      caller.setModeratorEmails({ mapId, moderatorEmails: ["not an email"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("member can enable sharing once there is a moderator", async () => {
    const caller = makeCaller(member);
    const share = await caller.enable({ mapId });
    expect(share.enabled).toBe(true);
  });

  test("the last moderator can't be removed while sharing", async () => {
    const caller = makeCaller(member);
    await expect(
      caller.setModeratorEmails({ mapId, moderatorEmails: [] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("member can disable and re-enable, keeping the same link", async () => {
    const caller = makeCaller(member);

    const disabled = await caller.disable({ mapId });
    expect(disabled.enabled).toBe(false);

    const reEnabled = await caller.enable({ mapId });
    expect(reEnabled.enabled).toBe(true);
    expect(reEnabled.token).toBe(disabled.token);
  });

  test("moderators can all be removed once sharing is off", async () => {
    const caller = makeCaller(member);
    await caller.disable({ mapId });
    const share = await caller.setModeratorEmails({
      mapId,
      moderatorEmails: [],
    });
    expect(share.moderatorEmails).toEqual([]);
  });
});
