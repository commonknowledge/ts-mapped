import { v4 as uuidv4 } from "uuid";
import { afterAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import {
  createDataSource,
  deleteDataSource,
  findDataSourceById,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { deleteUser, upsertUser } from "@/server/repositories/User";
import { privateFileExists } from "@/server/services/minio";
import { dataSourceRouter } from "@/server/trpc/routers/dataSource";
import { storeTestCsv } from "../../../../helpers/csv";

const userIds: string[] = [];
const dataSourceIds: string[] = [];

const createMember = async () => {
  const organisation = await upsertOrganisation({
    name: `CSV Router Org ${uuidv4()}`,
  });
  const user = await upsertUser({
    email: `csv-router-${uuidv4()}@example.com`,
    password: "test-password-123",
    name: "Test User",
    avatarUrl: null,
  });
  userIds.push(user.id);
  await upsertOrganisationUser({
    organisationId: organisation.id,
    userId: user.id,
  });
  const caller = dataSourceRouter.createCaller({ user, ip: "127.0.0.1" });
  return { organisation, caller };
};

describe("dataSource.create with CSV files", () => {
  test("creates a data source from the organisation's own upload", async () => {
    const { organisation, caller } = await createMember();
    const config = await storeTestCsv({
      fixture: "stats.csv",
      organisationId: organisation.id,
    });

    const dataSource = await caller.create({
      organisationId: organisation.id,
      name: "Own upload",
      recordType: DataSourceRecordType.Data,
      config,
    });
    dataSourceIds.push(dataSource.id);

    expect(dataSource.config).toEqual(config);
    expect(dataSource.columnDefs.length).toBeGreaterThan(0);
  });

  test("refuses another organisation's upload", async () => {
    const { organisation, caller } = await createMember();
    const other = await upsertOrganisation({ name: `Other ${uuidv4()}` });
    const config = await storeTestCsv({
      fixture: "stats.csv",
      organisationId: other.id,
    });

    await expect(
      caller.create({
        organisationId: organisation.id,
        name: "Someone else's upload",
        recordType: DataSourceRecordType.Data,
        config,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test.each([
    { url: "file://.env" },
    { url: "file://../../../etc/passwd" },
    { url: "http://169.254.169.254/latest/meta-data/" },
    { fileKey: "../.env" },
    { fileKey: "sample/../../.env" },
  ])("refuses the config %o", async (fields) => {
    const { organisation, caller } = await createMember();

    await expect(
      caller.create({
        organisationId: organisation.id,
        name: "Bad config",
        recordType: DataSourceRecordType.Data,
        // @ts-expect-error: deliberately invalid input, as an attacker could send
        config: { type: DataSourceType.CSV, ...fields },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("dataSource.delete with CSV files", () => {
  const createCsvDataSource = async ({
    organisationId,
    config,
  }: {
    organisationId: string;
    config: Awaited<ReturnType<typeof storeTestCsv>>;
  }) => {
    const dataSource = await createDataSource({
      name: `CSV ${uuidv4()}`,
      organisationId,
      autoEnrich: false,
      autoImport: false,
      config,
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      public: false,
      recordType: DataSourceRecordType.Data,
    });
    dataSourceIds.push(dataSource.id);
    return dataSource;
  };

  test("deletes the uploaded file", async () => {
    const { organisation, caller } = await createMember();
    const config = await storeTestCsv({
      fixture: "stats.csv",
      organisationId: organisation.id,
    });
    const dataSource = await createCsvDataSource({
      organisationId: organisation.id,
      config,
    });

    await caller.delete({ dataSourceId: dataSource.id });

    expect(await findDataSourceById(dataSource.id)).toBeUndefined();
    expect(await privateFileExists(config.fileKey)).toBe(false);
  });

  test("keeps a file another data source still uses", async () => {
    const { organisation, caller } = await createMember();
    const config = await storeTestCsv({
      fixture: "stats.csv",
      organisationId: organisation.id,
    });
    const first = await createCsvDataSource({
      organisationId: organisation.id,
      config,
    });
    // Configs are unique per organisation, so the other user is elsewhere
    const other = await upsertOrganisation({ name: `Other ${uuidv4()}` });
    await createCsvDataSource({ organisationId: other.id, config });

    await caller.delete({ dataSourceId: first.id });

    expect(await privateFileExists(config.fileKey)).toBe(true);
  });

  test("keeps sample files", async () => {
    const { organisation, caller } = await createMember();
    const dataSource = await createCsvDataSource({
      organisationId: organisation.id,
      config: { type: DataSourceType.CSV, fileKey: "sample/sampleMembers.csv" },
    });

    await caller.delete({ dataSourceId: dataSource.id });

    expect(await privateFileExists("sample/sampleMembers.csv")).toBe(true);
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
