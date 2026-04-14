import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { UserRole } from "@/models/User";
import {
  deleteUser,
  findUserById,
  updateUserRole,
  upsertUser,
} from "@/server/repositories/User";
import { invitationRouter } from "@/server/trpc/routers/invitation";

const userIds: string[] = [];

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
  return invitationRouter.createCaller({ user, ip: "127.0.0.1" });
}

describe("invitation.list", () => {
  test("superadmin can list invitations", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const caller = makeCaller(superadmin);

    const result = await caller.list();
    expect(Array.isArray(result)).toBe(true);
  });

  test("advocate can list invitations", async () => {
    const advocate = await createTestUser(UserRole.Advocate);
    const caller = makeCaller(advocate);

    const result = await caller.list();
    expect(Array.isArray(result)).toBe(true);
  });

  test("regular user cannot list invitations", async () => {
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(caller.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("unauthenticated user cannot list invitations", async () => {
    const caller = makeCaller(null);

    await expect(caller.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("invitation.create", () => {
  test("regular user cannot create invitations", async () => {
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(
      caller.create({
        name: "Test",
        email: "test@example.com",
        organisationName: "Test Org",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("unauthenticated user cannot create invitations", async () => {
    const caller = makeCaller(null);

    await expect(
      caller.create({
        name: "Test",
        email: "test@example.com",
        organisationName: "Test Org",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

afterAll(async () => {
  for (const id of userIds) {
    try {
      await deleteUser(id);
    } catch {
      // already deleted
    }
  }
});
