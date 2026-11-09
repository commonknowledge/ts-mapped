import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import { OrganisationUserRole } from "@/models/OrganisationUser";
import { UserRole } from "@/models/User";
import {
  deleteOrganisation,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import {
  findOrganisationUser,
  upsertOrganisationUser,
} from "@/server/repositories/OrganisationUser";
import {
  deleteUser,
  findUserById,
  updateUserRole,
  upsertUser,
} from "@/server/repositories/User";
import { organisationRouter } from "@/server/trpc/routers/organisation";
import { userRouter } from "@/server/trpc/routers/user";

const userIds: string[] = [];
const organisationIds: string[] = [];

async function createTestOrganisation() {
  const organisation = await upsertOrganisation({
    name: `Test Org ${uuidv4()}`,
  });
  organisationIds.push(organisation.id);
  return organisation;
}

async function createTestUser(role?: UserRole) {
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
  const found = await findUserById(user.id);
  if (!found) throw new Error("User not found");
  return found;
}

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

function makeCaller(user: TestUser | null) {
  return organisationRouter.createCaller({ user, ip: "127.0.0.1" });
}

/** An organisation with an admin (its first member) and a regular member. */
async function createOrganisationWithMembers() {
  const organisation = await createTestOrganisation();
  const admin = await createTestUser();
  const member = await createTestUser();
  await upsertOrganisationUser({
    organisationId: organisation.id,
    userId: admin.id,
  });
  await upsertOrganisationUser({
    organisationId: organisation.id,
    userId: member.id,
  });
  return { organisation, admin, member };
}

describe("upsertOrganisationUser", () => {
  test("first member becomes admin, later members are members", async () => {
    const { organisation, admin, member } =
      await createOrganisationWithMembers();

    const adminMembership = await findOrganisationUser(
      organisation.id,
      admin.id,
    );
    const memberMembership = await findOrganisationUser(
      organisation.id,
      member.id,
    );
    expect(adminMembership?.role).toBe(OrganisationUserRole.Admin);
    expect(memberMembership?.role).toBe(OrganisationUserRole.Member);
  });

  test("re-adding an existing member keeps their role", async () => {
    const { organisation, admin } = await createOrganisationWithMembers();

    const again = await upsertOrganisationUser({
      organisationId: organisation.id,
      userId: admin.id,
    });
    expect(again.role).toBe(OrganisationUserRole.Admin);
  });
});

describe("organisation.listUsers", () => {
  test("includes each member's role", async () => {
    const { organisation, admin, member } =
      await createOrganisationWithMembers();

    const users = await makeCaller(member).listUsers({
      organisationId: organisation.id,
    });
    expect(users.find((u) => u.id === admin.id)?.role).toBe(
      OrganisationUserRole.Admin,
    );
    expect(users.find((u) => u.id === member.id)?.role).toBe(
      OrganisationUserRole.Member,
    );
  });
});

describe("organisation.list", () => {
  test("includes the current user's role in each organisation", async () => {
    const { organisation, admin, member } =
      await createOrganisationWithMembers();

    const adminOrgs = await makeCaller(admin).list();
    const memberOrgs = await makeCaller(member).list();
    expect(adminOrgs.find((o) => o.id === organisation.id)?.memberRole).toBe(
      OrganisationUserRole.Admin,
    );
    expect(memberOrgs.find((o) => o.id === organisation.id)?.memberRole).toBe(
      OrganisationUserRole.Member,
    );
  });
});

describe("organisation.removeMember", () => {
  test("admin can remove a member", async () => {
    const { organisation, admin, member } =
      await createOrganisationWithMembers();

    await makeCaller(admin).removeMember({
      organisationId: organisation.id,
      userId: member.id,
    });

    expect(await findOrganisationUser(organisation.id, member.id)).toBe(
      undefined,
    );
    // The user account itself is kept
    expect(await findUserById(member.id)).toBeDefined();
  });

  test("admin cannot remove another admin", async () => {
    const { organisation, admin } = await createOrganisationWithMembers();
    const otherAdmin = await createTestUser();
    await upsertOrganisationUser({
      organisationId: organisation.id,
      userId: otherAdmin.id,
      role: OrganisationUserRole.Admin,
    });

    await expect(
      makeCaller(otherAdmin).removeMember({
        organisationId: organisation.id,
        userId: admin.id,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await findOrganisationUser(organisation.id, admin.id)).toBeDefined();
  });

  test("admin cannot remove themselves", async () => {
    const { organisation, admin } = await createOrganisationWithMembers();

    await expect(
      makeCaller(admin).removeMember({
        organisationId: organisation.id,
        userId: admin.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("member cannot remove other members", async () => {
    const { organisation, member } = await createOrganisationWithMembers();
    const otherMember = await createTestUser();
    await upsertOrganisationUser({
      organisationId: organisation.id,
      userId: otherMember.id,
    });

    await expect(
      makeCaller(member).removeMember({
        organisationId: organisation.id,
        userId: otherMember.id,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("admin of another organisation cannot remove members", async () => {
    const { organisation, member } = await createOrganisationWithMembers();
    const { admin: outsideAdmin } = await createOrganisationWithMembers();

    await expect(
      makeCaller(outsideAdmin).removeMember({
        organisationId: organisation.id,
        userId: member.id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("organisation.inviteMember", () => {
  test("member cannot invite", async () => {
    const { organisation, member } = await createOrganisationWithMembers();

    await expect(
      makeCaller(member).inviteMember({
        organisationId: organisation.id,
        name: "New Person",
        email: `test-${uuidv4()}@example.com`,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("organisation.setMemberRole / removeUser (superadmin)", () => {
  test("superadmin can promote a member to admin", async () => {
    const { organisation, member } = await createOrganisationWithMembers();
    const superadmin = await createTestUser(UserRole.Superadmin);

    await makeCaller(superadmin).setMemberRole({
      organisationId: organisation.id,
      userId: member.id,
      role: OrganisationUserRole.Admin,
    });

    const membership = await findOrganisationUser(organisation.id, member.id);
    expect(membership?.role).toBe(OrganisationUserRole.Admin);
  });

  test("superadmin can remove an admin from an organisation", async () => {
    const { organisation, admin } = await createOrganisationWithMembers();
    const superadmin = await createTestUser(UserRole.Superadmin);

    await makeCaller(superadmin).removeUser({
      organisationId: organisation.id,
      userId: admin.id,
    });

    expect(await findOrganisationUser(organisation.id, admin.id)).toBe(
      undefined,
    );
  });

  test("organisation admin cannot use superadmin procedures", async () => {
    const { organisation, admin, member } =
      await createOrganisationWithMembers();

    await expect(
      makeCaller(admin).setMemberRole({
        organisationId: organisation.id,
        userId: member.id,
        role: OrganisationUserRole.Admin,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      makeCaller(admin).removeUser({
        organisationId: organisation.id,
        userId: member.id,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("user.delete", () => {
  test("superadmin can delete a user, removing their memberships", async () => {
    const { organisation, member } = await createOrganisationWithMembers();
    const superadmin = await createTestUser(UserRole.Superadmin);

    await userRouter
      .createCaller({ user: superadmin, ip: "127.0.0.1" })
      .delete({ userId: member.id });

    expect(await findUserById(member.id)).toBe(undefined);
    expect(await findOrganisationUser(organisation.id, member.id)).toBe(
      undefined,
    );
  });

  test("superadmin cannot delete themselves", async () => {
    const superadmin = await createTestUser(UserRole.Superadmin);

    await expect(
      userRouter
        .createCaller({ user: superadmin, ip: "127.0.0.1" })
        .delete({ userId: superadmin.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("organisation admin cannot delete users", async () => {
    const { admin, member } = await createOrganisationWithMembers();

    await expect(
      userRouter
        .createCaller({ user: admin, ip: "127.0.0.1" })
        .delete({ userId: member.id }),
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
  for (const id of organisationIds) {
    try {
      await deleteOrganisation(id);
    } catch {
      // already deleted
    }
  }
});
