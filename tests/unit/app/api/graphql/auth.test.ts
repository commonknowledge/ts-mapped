import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthDirectiveArgs,
  DataSourceRecordType,
  GeocodingType,
  ProtectedArgs,
} from "@/__generated__/types";
import {
  _checkArg as checkArg,
  _checkArgs as checkArgs,
  _checkAuth as checkAuth,
  _dataSourceGuard as dataSourceGuard,
  _mapGuard as mapGuard,
  _organisationGuard as organisationGuard,
} from "@/app/api/graphql/auth";
import { GraphQLContext } from "@/app/api/graphql/context";
import { NULL_UUID } from "@/constants";
import { DataSource, DataSourceType } from "@/server/models/DataSource";
import { Map } from "@/server/models/Map";
import { Organisation } from "@/server/models/Organisation";
import { User } from "@/server/models/User";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { createMap, deleteMap } from "@/server/repositories/Map";
import {
  deleteOrganisation,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { deleteUser, upsertUser } from "@/server/repositories/User";

describe("Auth Functions", () => {
  let testUser: User;
  let testOrganisation: Organisation;
  let testDataSource: DataSource;
  let testMap: Map;
  let otherUser: User;
  let otherOrganisation: Organisation;
  let publicDataSource: DataSource;

  beforeEach(async () => {
    // Create test users
    testUser = await upsertUser({
      email: "test@example.com",
      name: "Test User",
      password: "password",
    });
    otherUser = await upsertUser({
      email: "other@example.com",
      name: "Other User",
      password: "password",
    });

    // Create test organisations
    testOrganisation = await upsertOrganisation({ name: "Test Org" });
    otherOrganisation = await upsertOrganisation({ name: "Other Org" });

    // Create organisation user relationships
    await upsertOrganisationUser({
      organisationId: testOrganisation.id,
      userId: testUser.id,
    });
    await upsertOrganisationUser({
      organisationId: otherOrganisation.id,
      userId: otherUser.id,
    });

    // Create test data sources
    testDataSource = await createDataSource({
      name: "Test Data Source",
      recordType: DataSourceRecordType.Data,
      autoEnrich: false,
      autoImport: false,
      config: { type: DataSourceType.CSV, url: "file://dummy.csv" },
      columnDefs: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: testOrganisation.id,
      public: false,
    });

    publicDataSource = await createDataSource({
      name: "Public Data Source",
      autoEnrich: false,
      recordType: DataSourceRecordType.Data,
      autoImport: false,
      config: { type: DataSourceType.CSV, url: "file://public.csv" },
      columnDefs: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: testOrganisation.id,
      public: true,
    });

    // Create test map
    testMap = await createMap(testOrganisation.id);
  });

  afterEach(async () => {
    await deleteUser(testUser.id);
    await deleteOrganisation(testOrganisation.id);
    await deleteDataSource(testDataSource.id);
    await deleteMap(testMap.id);
    await deleteUser(otherUser.id);
    await deleteOrganisation(otherOrganisation.id);
    await deleteDataSource(publicDataSource.id);
  });

  describe("checkAuth", () => {
    it("should return true for unauthed access to public data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: publicDataSource.id };
      const context: GraphQLContext = { currentUser: null };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(true);
    });

    it("should return false for unauthed access to private data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: testDataSource.id };
      const context: GraphQLContext = { currentUser: null };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });

    it("should return true for authed read access to public data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: publicDataSource.id };
      const context: GraphQLContext = {
        currentUser: { id: otherUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(true);
    });

    it("should return true when user has read access to their organisation data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: testDataSource.id };
      const context: GraphQLContext = {
        currentUser: { id: testUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(true);
    });

    it("should return false when user does not have read access to private data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: testDataSource.id };
      const context: GraphQLContext = {
        currentUser: { id: otherUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });

    it("should return true when user has write access to their organisation data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        write: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: testDataSource.id };
      const context: GraphQLContext = {
        currentUser: { id: testUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(true);
    });

    it("should return false when user does not have write access to other organisation data source", async () => {
      const authDirective: AuthDirectiveArgs = {
        write: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: testDataSource.id };
      const context: GraphQLContext = {
        currentUser: { id: otherUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });

    it("should return true when both read and write permissions are satisfied", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
        write: { mapIdArg: "mapId" },
      };
      const fieldArgs = {
        dataSourceId: testDataSource.id,
        mapId: testMap.id,
      };
      const context: GraphQLContext = {
        currentUser: { id: testUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(true);
    });

    it("should return false when read permission fails even if write permission passes", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
        write: { organisationIdArg: "organisationId" },
      };
      const fieldArgs = {
        dataSourceId: testDataSource.id,
        organisationId: otherOrganisation.id,
      };
      const context: GraphQLContext = {
        currentUser: { id: otherUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });

    it("should return false when write permission fails even if read permission passes", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
        write: { dataSourceIdArg: "otherDataSourceId" },
      };
      const fieldArgs = {
        dataSourceId: publicDataSource.id,
        otherDataSourceId: testDataSource.id,
      };
      const context: GraphQLContext = {
        currentUser: { id: otherUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });

    it("should return false and log error when an exception occurs", async () => {
      const authDirective: AuthDirectiveArgs = {
        read: { dataSourceIdArg: "dataSourceId" },
      };
      const fieldArgs = { dataSourceId: NULL_UUID };
      const context: GraphQLContext = {
        currentUser: { id: testUser.id, name: "", email: "" },
      };

      const result = await checkAuth(authDirective, fieldArgs, context);
      expect(result).toBe(false);
    });
  });

  describe("dataSourceGuard", () => {
    it("should return true for public data source with read access", async () => {
      const result = await dataSourceGuard(
        publicDataSource.id,
        otherUser.id,
        "read",
      );
      expect(result).toBe(true);
    });

    it("should return false for public data source with write access from non-member", async () => {
      const result = await dataSourceGuard(
        publicDataSource.id,
        otherUser.id,
        "write",
      );
      expect(result).toBe(false);
    });

    it("should return true for private data source with organisation member", async () => {
      const result = await dataSourceGuard(
        testDataSource.id,
        testUser.id,
        "read",
      );
      expect(result).toBe(true);
    });

    it("should return false for private data source with non-member", async () => {
      const result = await dataSourceGuard(
        testDataSource.id,
        otherUser.id,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should return false for non-existent data source", async () => {
      const result = await dataSourceGuard(NULL_UUID, testUser.id, "read");
      expect(result).toBe(false);
    });
  });

  describe("mapGuard", () => {
    it("should return true for organisation member", async () => {
      const result = await mapGuard(testMap.id, testUser.id, "read");
      expect(result).toBe(true);
    });

    it("should return false for non-organisation member", async () => {
      const result = await mapGuard(testMap.id, otherUser.id, "read");
      expect(result).toBe(false);
    });

    it("should return false for non-existent map", async () => {
      const result = await mapGuard(NULL_UUID, testUser.id, "read");
      expect(result).toBe(false);
    });
  });

  describe("organisationGuard", () => {
    it("should return true for organisation member", async () => {
      const result = await organisationGuard(
        testOrganisation.id,
        testUser.id,
        "read",
      );
      expect(result).toBe(true);
    });

    it("should return false for non-organisation member", async () => {
      const result = await organisationGuard(
        testOrganisation.id,
        otherUser.id,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should return false for non-existent organisation", async () => {
      const result = await organisationGuard(NULL_UUID, testUser.id, "read");
      expect(result).toBe(false);
    });
  });

  describe("checkArg", () => {
    it("should return true when the arg passes its guard", async () => {
      const result = await checkArg(
        "dataSourceIdArg",
        testDataSource.id,
        testUser.id,
        "read",
      );
      expect(result).toBe(true);
    });

    it("should return false when any protected arg fails its guard", async () => {
      const result = await checkArg(
        "dataSourceIdArg",
        testDataSource.id,
        otherUser.id,
        "read",
      );
      expect(result).toBe(false);
    });
  });

  describe("checkArgs", () => {
    it("should return true when all protected args pass their guards", async () => {
      const protectedArgs: ProtectedArgs = {
        dataSourceIdArg: "dataSourceId",
        mapIdArg: "mapId",
      };
      const fieldArgs = {
        dataSourceId: testDataSource.id,
        mapId: testMap.id,
      };

      const result = await checkArgs(
        protectedArgs,
        fieldArgs,
        testUser.id,
        "read",
      );
      expect(result).toBe(true);
    });

    it("should return false when any protected arg fails its guard", async () => {
      const protectedArgs: ProtectedArgs = {
        dataSourceIdArg: "dataSourceId",
        mapIdArg: "mapId",
      };
      const fieldArgs = {
        dataSourceId: testDataSource.id,
        mapId: testMap.id,
      };

      const result = await checkArgs(
        protectedArgs,
        fieldArgs,
        otherUser.id,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should handle mixed access results correctly", async () => {
      const protectedArgs: ProtectedArgs = {
        dataSourceIdArg: "publicDataSourceId",
        organisationIdArg: "organisationId",
      };
      const fieldArgs = {
        publicDataSourceId: publicDataSource.id,
        organisationId: otherOrganisation.id,
      };

      // Public data source should pass for read, but wrong organisation should fail
      const result = await checkArgs(
        protectedArgs,
        fieldArgs,
        testUser.id,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should handle empty protected args", async () => {
      const protectedArgs: ProtectedArgs = {};
      const fieldArgs = {};

      const result = await checkArgs(
        protectedArgs,
        fieldArgs,
        testUser.id,
        "read",
      );
      expect(result).toBe(true);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing field args gracefully", async () => {
      const protectedArgs: ProtectedArgs = {
        dataSourceIdArg: "missingArg",
      };
      const fieldArgs = {};

      const result = await checkArgs(
        protectedArgs,
        fieldArgs,
        testUser.id,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should handle undefined user ID", async () => {
      const result = await dataSourceGuard(
        testDataSource.id,
        undefined,
        "read",
      );
      expect(result).toBe(false);
    });

    it("should handle null field values", async () => {
      const result = await dataSourceGuard(null, testUser.id, "read");
      expect(result).toBe(false);
    });
  });
});
