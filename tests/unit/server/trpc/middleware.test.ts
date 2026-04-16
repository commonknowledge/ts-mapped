import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { TRIAL_EXPIRED_MESSAGE } from "@/constants";
import {
  deleteUser,
  updateUserRole,
  updateUserTrialEndsAt,
  upsertUser,
} from "@/server/repositories/User";
import { invitationRouter } from "@/server/trpc/routers/invitation";
import type { UserRole } from "@/models/User";

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
  }
  return user;
}

// listForUser is a simple protectedProcedure — good for testing the middleware
function makeCaller(user: Awaited<ReturnType<typeof createTestUser>> | null) {
  return invitationRouter.createCaller({ user, ip: "127.0.0.1" });
}

describe("enforceUserIsAuthed trial expiry", () => {
  test("allows user with no trialEndsAt", async () => {
    const user = await createTestUser();
    const caller = makeCaller(user);
    const result = await caller.listForUser();
    expect(Array.isArray(result)).toBe(true);
  });

  test("allows user with trialEndsAt in the future", async () => {
    const user = await createTestUser();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await updateUserTrialEndsAt(user.id, futureDate);
    const updatedUser = { ...user, trialEndsAt: futureDate };
    const caller = makeCaller(updatedUser);
    const result = await caller.listForUser();
    expect(Array.isArray(result)).toBe(true);
  });

  test("blocks user with trialEndsAt in the past with FORBIDDEN", async () => {
    const user = await createTestUser();
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await updateUserTrialEndsAt(user.id, pastDate);
    const updatedUser = { ...user, trialEndsAt: pastDate };
    const caller = makeCaller(updatedUser);
    await expect(caller.listForUser()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: TRIAL_EXPIRED_MESSAGE,
    });
  });

  test("blocks unauthenticated user with UNAUTHORIZED", async () => {
    const caller = makeCaller(null);
    await expect(caller.listForUser()).rejects.toMatchObject({
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
