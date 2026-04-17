import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test, vi } from "vitest";
import { DEFAULT_TRIAL_PERIOD_DAYS } from "@/constants";
import { createInvitation } from "@/server/repositories/Invitation";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { deleteUser, findUserByEmail } from "@/server/repositories/User";
import { authRouter } from "@/server/trpc/routers/auth";

vi.mock("@/auth/jwt", () => ({
  setJWT: vi.fn(),
}));
vi.mock("@/server/services/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/server/services/mailer", () => ({
  sendEmail: vi.fn(),
}));

const userEmails: string[] = [];

function makeCaller() {
  return authRouter.createCaller({ user: null, ip: "127.0.0.1" });
}

async function createInviteToken(invitationId: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  return new SignJWT({ invitationId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

describe("auth.confirmInvite", () => {
  test("trial invitation sets trialEndsAt on the user", async () => {
    const org = await upsertOrganisation({ name: `Org ${uuidv4()}` });
    const email = `trial-${uuidv4()}@example.com`;
    userEmails.push(email);

    const invitation = await createInvitation({
      email,
      name: "Trial User",
      organisationId: org.id,
      senderOrganisationId: org.id,
      trialDays: DEFAULT_TRIAL_PERIOD_DAYS,
    });

    const token = await createInviteToken(invitation.id);
    const caller = makeCaller();
    const result = await caller.confirmInvite({
      token,
      password: "test-password-123",
    });

    expect(result.trialEndsAt).toBeTruthy();
    if (!result.trialEndsAt) return;
    const trialEndsAt = new Date(result.trialEndsAt);
    const expectedMin = new Date(
      Date.now() + (DEFAULT_TRIAL_PERIOD_DAYS - 1) * 24 * 60 * 60 * 1000,
    );
    const expectedMax = new Date(
      Date.now() + (DEFAULT_TRIAL_PERIOD_DAYS + 1) * 24 * 60 * 60 * 1000,
    );
    expect(trialEndsAt.getTime()).toBeGreaterThan(expectedMin.getTime());
    expect(trialEndsAt.getTime()).toBeLessThan(expectedMax.getTime());
  });

  test("non-trial invitation does not set trialEndsAt", async () => {
    const org = await upsertOrganisation({ name: `Org ${uuidv4()}` });
    const email = `nontrial-${uuidv4()}@example.com`;
    userEmails.push(email);

    const invitation = await createInvitation({
      email,
      name: "Regular User",
      organisationId: org.id,
      senderOrganisationId: org.id,
    });

    const token = await createInviteToken(invitation.id);
    const caller = makeCaller();
    const result = await caller.confirmInvite({
      token,
      password: "test-password-123",
    });

    expect(result.trialEndsAt).toBeNull();
  });

  test("trial invitation with custom days sets correct trialEndsAt", async () => {
    const org = await upsertOrganisation({ name: `Org ${uuidv4()}` });
    const email = `custom-trial-${uuidv4()}@example.com`;
    userEmails.push(email);

    const customDays = 14;
    const invitation = await createInvitation({
      email,
      name: "Custom Trial User",
      organisationId: org.id,
      senderOrganisationId: org.id,
      trialDays: customDays,
    });

    const token = await createInviteToken(invitation.id);
    const caller = makeCaller();
    const result = await caller.confirmInvite({
      token,
      password: "test-password-123",
    });

    expect(result.trialEndsAt).toBeTruthy();
    if (!result.trialEndsAt) return;
    const trialEndsAt = new Date(result.trialEndsAt);
    const expectedMin = new Date(
      Date.now() + (customDays - 1) * 24 * 60 * 60 * 1000,
    );
    const expectedMax = new Date(
      Date.now() + (customDays + 1) * 24 * 60 * 60 * 1000,
    );
    expect(trialEndsAt.getTime()).toBeGreaterThan(expectedMin.getTime());
    expect(trialEndsAt.getTime()).toBeLessThan(expectedMax.getTime());
  });

  test("trial invitation does not overwrite existing trialEndsAt", async () => {
    const org = await upsertOrganisation({ name: `Org ${uuidv4()}` });
    const email = `existing-trial-${uuidv4()}@example.com`;
    userEmails.push(email);

    // First invitation sets trialEndsAt
    const invitation1 = await createInvitation({
      email,
      name: "Existing Trial User",
      organisationId: org.id,
      senderOrganisationId: org.id,
      trialDays: DEFAULT_TRIAL_PERIOD_DAYS,
    });

    const token1 = await createInviteToken(invitation1.id);
    const caller = makeCaller();
    const firstResult = await caller.confirmInvite({
      token: token1,
      password: "test-password-123",
    });
    const originalTrialEndsAt = firstResult.trialEndsAt;
    expect(originalTrialEndsAt).toBeTruthy();

    // Second trial invitation should not overwrite
    const invitation2 = await createInvitation({
      email,
      name: "Existing Trial User",
      organisationId: org.id,
      senderOrganisationId: org.id,
      trialDays: DEFAULT_TRIAL_PERIOD_DAYS,
    });

    const token2 = await createInviteToken(invitation2.id);
    const secondResult = await caller.confirmInvite({
      token: token2,
      password: "test-password-123",
    });

    expect(secondResult.trialEndsAt).toBeTruthy();
    expect(originalTrialEndsAt).toBeTruthy();
    if (!secondResult.trialEndsAt || !originalTrialEndsAt) return;
    expect(new Date(secondResult.trialEndsAt).getTime()).toBe(
      new Date(originalTrialEndsAt).getTime(),
    );
  });
});

afterAll(async () => {
  for (const email of userEmails) {
    try {
      const user = await findUserByEmail(email);
      if (user) await deleteUser(user.id);
    } catch {
      // already deleted
    }
  }
});
