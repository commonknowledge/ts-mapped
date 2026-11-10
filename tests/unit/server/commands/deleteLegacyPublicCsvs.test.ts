import * as fs from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import deleteLegacyPublicCsvs from "@/server/commands/deleteLegacyPublicCsvs";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";
import { createCsvFileKey, deletePrivateFile } from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";
import { storeTestCsv } from "../../../helpers/csv";
import type { CSVConfig } from "@/models/DataSource";

const uploadsPath = (filename: string) =>
  join(getBaseDir(), "uploads", filename);

const exists = (path: string) =>
  fs.access(path).then(
    () => true,
    () => false,
  );

const findLog = (dataSourceId: string) =>
  db
    .selectFrom("csvUploadMigration")
    .where("dataSourceId", "=", dataSourceId)
    .selectAll()
    .executeTakeFirstOrThrow();

const cleanups: (() => Promise<void>)[] = [];

/**
 * Sets up the state the migration leaves behind: a data source using a file
 * in private storage, the old public copy, and a row in the migration log.
 */
const createMigratedDataSource = async ({
  withPrivateCopy,
}: {
  withPrivateCopy: boolean;
}) => {
  const organisation = await upsertOrganisation({
    name: `Cleanup Org ${uuidv4()}`,
  });
  const config: CSVConfig = withPrivateCopy
    ? await storeTestCsv({
        fixture: "stats.csv",
        organisationId: organisation.id,
      })
    : { type: DataSourceType.CSV, fileKey: createCsvFileKey(organisation.id) };
  const dataSource = await createDataSource({
    name: `Migrated CSV ${uuidv4()}`,
    organisationId: organisation.id,
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

  const legacyFile = `legacy_${uuidv4()}.csv`;
  await fs.mkdir(join(getBaseDir(), "uploads"), { recursive: true });
  await fs.writeFile(uploadsPath(legacyFile), "a\n1\n");

  await db
    .insertInto("csvUploadMigration")
    .values({
      dataSourceId: dataSource.id,
      legacyUrl: `/api/upload/${legacyFile}`,
      legacyPublicObject: null,
      legacyLocalFile: legacyFile,
      fileKey: config.fileKey,
    })
    .execute();

  cleanups.push(async () => {
    await db
      .deleteFrom("csvUploadMigration")
      .where("dataSourceId", "=", dataSource.id)
      .execute();
    await deleteDataSource(dataSource.id);
    await deletePrivateFile(config.fileKey);
    await fs.rm(uploadsPath(legacyFile), { force: true });
  });

  return { dataSource, legacyFile };
};

// Tests in a file run one at a time, which matters here: the command acts on
// every row in the migration log
describe("deleteLegacyPublicCsvs", () => {
  afterEach(async () => {
    while (cleanups.length) {
      await cleanups.pop()?.();
    }
  });

  test("refuses to run against a remote MinIO when not on Render", async () => {
    vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
    vi.stubEnv("RENDER", "");
    try {
      await expect(
        deleteLegacyPublicCsvs({ confirm: true, includeOrphans: true }),
      ).rejects.toThrow("Refusing to delete public CSVs");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test("a dry run deletes nothing", async () => {
    const { dataSource, legacyFile } = await createMigratedDataSource({
      withPrivateCopy: true,
    });

    await deleteLegacyPublicCsvs({ confirm: false, includeOrphans: false });

    expect(await exists(uploadsPath(legacyFile))).toBe(true);
    expect((await findLog(dataSource.id)).legacyDeletedAt).toBeNull();
  });

  test("with confirm, deletes the public copy and records it", async () => {
    const { dataSource, legacyFile } = await createMigratedDataSource({
      withPrivateCopy: true,
    });

    await deleteLegacyPublicCsvs({ confirm: true, includeOrphans: false });

    expect(await exists(uploadsPath(legacyFile))).toBe(false);
    expect((await findLog(dataSource.id)).legacyDeletedAt).toBeInstanceOf(Date);
  });

  test("never deletes the only copy of a file a data source uses", async () => {
    const { dataSource, legacyFile } = await createMigratedDataSource({
      withPrivateCopy: false,
    });

    await expect(
      deleteLegacyPublicCsvs({ confirm: true, includeOrphans: false }),
    ).rejects.toThrow("private copy is missing");

    expect(await exists(uploadsPath(legacyFile))).toBe(true);
    expect((await findLog(dataSource.id)).legacyDeletedAt).toBeNull();
  });

  test("deletes the public copy of a data source deleted since", async () => {
    const { dataSource, legacyFile } = await createMigratedDataSource({
      withPrivateCopy: false,
    });
    await deleteDataSource(dataSource.id);

    await deleteLegacyPublicCsvs({ confirm: true, includeOrphans: false });

    expect(await exists(uploadsPath(legacyFile))).toBe(false);
  });
});
