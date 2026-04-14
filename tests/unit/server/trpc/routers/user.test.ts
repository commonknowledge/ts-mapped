import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { UserRole } from "@/models/User";
import {
  deleteUser,
  findUserById,
  updateUserRole,
  upsertUser,
} from "@/server/repositories/User";
import { userRouter } from "@/server/trpc/routers/user";

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
  return userRouter.createCaller({ user, ip: "127.0.0.1" });
}

describe("user.updateRole", () => {
  test("superadmin can set a user's role to Advocate", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const target = await createTestUser();
    const caller = makeCaller(superadmin);

    await caller.updateRole({ userId: target.id, role: UserRole.Advocate });

    const users = await caller.list();
    const updated = users.find((u) => u.id === target.id);
    expect(updated?.role).toBe(UserRole.Advocate);
  });

  test("superadmin can set a user's role to Superadmin", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const target = await createTestUser();
    const caller = makeCaller(superadmin);

    await caller.updateRole({ userId: target.id, role: UserRole.Superadmin });

    const users = await caller.list();
    const updated = users.find((u) => u.id === target.id);
    expect(updated?.role).toBe(UserRole.Superadmin);
  });

  test("superadmin can clear a user's role to null", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const target = await createTestUser(UserRole.Advocate);
    const caller = makeCaller(superadmin);

    await caller.updateRole({ userId: target.id, role: null });

    const users = await caller.list();
    const updated = users.find((u) => u.id === target.id);
    expect(updated?.role).toBeNull();
  });

  test("advocate cannot update roles", async () => {
    const advocate = await createTestUser(UserRole.Advocate);
    const target = await createTestUser();
    const caller = makeCaller(advocate);

    await expect(
      caller.updateRole({ userId: target.id, role: UserRole.Advocate }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("regular user cannot update roles", async () => {
    const regular = await createTestUser();
    const target = await createTestUser();
    const caller = makeCaller(regular);

    await expect(
      caller.updateRole({ userId: target.id, role: UserRole.Advocate }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("unauthenticated user cannot update roles", async () => {
    const target = await createTestUser();
    const caller = makeCaller(null);

    await expect(
      caller.updateRole({ userId: target.id, role: UserRole.Advocate }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("user.list", () => {
  test("superadmin can list users", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);
    const caller = makeCaller(superadmin);

    const users = await caller.list();
    expect(Array.isArray(users)).toBe(true);
  });

  test("advocate cannot list users", async () => {
    const advocate = await createTestUser(UserRole.Advocate);
    const caller = makeCaller(advocate);

    await expect(caller.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("regular user cannot list users", async () => {
    const regular = await createTestUser();
    const caller = makeCaller(regular);

    await expect(caller.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
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
