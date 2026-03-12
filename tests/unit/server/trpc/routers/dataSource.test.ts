import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { deleteUser, upsertUser } from "@/server/repositories/User";
import { dataSourceRouter } from "@/server/trpc/routers/dataSource";

describe("dataSource router tests", () => {
  const dataSourceIds: string[] = [];
  const userIds: string[] = [];

  const createTestUser = async (emailPrefix: string) => {
    const user = await upsertUser({
      email: `${emailPrefix}-${uuidv4()}@example.com`,
      password: "test-password-123",
      name: "Test User",
      avatarUrl: null,
    });
    userIds.push(user.id);
    return user;
  };

  const createTestDataSource = async (
    organisationId: string,
    isPublic: boolean,
    name: string,
  ) => {
    const dataSource = await createDataSource({
      name,
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Data,
      config: {
        type: DataSourceType.CSV,
        url: `file://tests/resources/stats.csv?${uuidv4()}`,
      },
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId,
      public: isPublic,
    });
    dataSourceIds.push(dataSource.id);
    return dataSource;
  };

  describe("listReadable", () => {
    test("unauthenticated client can see public data sources", async () => {
      const org = await upsertOrganisation({
        name: "Test ListReadable Public Org",
      });
      const publicDs = await createTestDataSource(org.id, true, "Public DS");
      const privateDs = await createTestDataSource(org.id, false, "Private DS");

      const result = await dataSourceRouter.listReadable({
        ctx: { user: null },
        getRawInput: async () => ({}),
        path: "",
        type: "query",
        signal: undefined,
      });

      const ids = result.map((ds) => ds.id);
      expect(ids).toContain(publicDs.id);
      expect(ids).not.toContain(privateDs.id);
    });

    test("unauthenticated client gets FORBIDDEN when requesting by organisationId", async () => {
      const org = await upsertOrganisation({
        name: "Test ListReadable Unauthed Org Filter",
      });
      await createTestDataSource(org.id, true, "Public DS Org Filter");

      await expect(
        dataSourceRouter.listReadable({
          ctx: { user: null },
          getRawInput: async () => ({ activeOrganisationId: org.id }),
          path: "",
          type: "query",
          signal: undefined,
        }),
      ).rejects.toThrow(TRPCError);

      try {
        await dataSourceRouter.listReadable({
          ctx: { user: null },
          getRawInput: async () => ({ activeOrganisationId: org.id }),
          path: "",
          type: "query",
          signal: undefined,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(TRPCError);
        expect((e as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    test("authenticated user can see their organisation's private data sources", async () => {
      const user = await createTestUser("test-list-readable-member");
      const org = await upsertOrganisation({
        name: "Test ListReadable Member Org",
      });
      await upsertOrganisationUser({
        organisationId: org.id,
        userId: user.id,
      });
      const privateDs = await createTestDataSource(
        org.id,
        false,
        "Private DS Member",
      );

      const result = await dataSourceRouter.listReadable({
        ctx: { user },
        getRawInput: async () => ({}),
        path: "",
        type: "query",
        signal: undefined,
      });

      const ids = result.map((ds) => ds.id);
      expect(ids).toContain(privateDs.id);
    });

    test("authenticated user can filter by their organisationId", async () => {
      const user = await createTestUser("test-list-readable-org-filter");
      const org = await upsertOrganisation({
        name: "Test ListReadable Org Filter Authed",
      });
      await upsertOrganisationUser({
        organisationId: org.id,
        userId: user.id,
      });
      const ds = await createTestDataSource(
        org.id,
        false,
        "Private DS Org Filter",
      );

      const result = await dataSourceRouter.listReadable({
        ctx: { user },
        getRawInput: async () => ({ activeOrganisationId: org.id }),
        path: "",
        type: "query",
        signal: undefined,
      });

      const ids = result.map((r) => r.id);
      expect(ids).toContain(ds.id);
    });

    test("authenticated user gets FORBIDDEN when filtering by an organisation they don't belong to", async () => {
      const user = await createTestUser("test-list-readable-forbidden");
      const otherOrg = await upsertOrganisation({
        name: "Test ListReadable Other Org",
      });
      await createTestDataSource(otherOrg.id, true, "Public DS Other Org");

      await expect(
        dataSourceRouter.listReadable({
          ctx: { user },
          getRawInput: async () => ({ activeOrganisationId: otherOrg.id }),
          path: "",
          type: "query",
          signal: undefined,
        }),
      ).rejects.toThrow(TRPCError);

      try {
        await dataSourceRouter.listReadable({
          ctx: { user },
          getRawInput: async () => ({ activeOrganisationId: otherOrg.id }),
          path: "",
          type: "query",
          signal: undefined,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(TRPCError);
        expect((e as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    test("authenticated user cannot see private data sources from other organisations", async () => {
      const user = await createTestUser("test-list-readable-no-access");
      const userOrg = await upsertOrganisation({
        name: "Test ListReadable User Own Org",
      });
      await upsertOrganisationUser({
        organisationId: userOrg.id,
        userId: user.id,
      });
      const otherOrg = await upsertOrganisation({
        name: "Test ListReadable Other Private Org",
      });
      const otherPrivateDs = await createTestDataSource(
        otherOrg.id,
        false,
        "Private DS Other Org",
      );

      const result = await dataSourceRouter.listReadable({
        ctx: { user },
        getRawInput: async () => ({}),
        path: "",
        type: "query",
        signal: undefined,
      });

      const ids = result.map((ds) => ds.id);
      expect(ids).not.toContain(otherPrivateDs.id);
    });
  });

  afterAll(async () => {
    for (const id of dataSourceIds) {
      await deleteDataSource(id);
    }
    for (const id of userIds) {
      await deleteUser(id);
    }
  });
});
