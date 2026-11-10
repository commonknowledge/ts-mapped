import * as fs from "fs/promises";
import { join } from "path";
import { sql } from "kysely";
import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, describe, expect, test, vi } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/models/DataSource";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";
import {
  PUBLIC_BUCKET,
  createCsvFileKey,
  deletePrivateFile,
  getClient,
  getMinioOrigin,
  isMinioConfigured,
  privateFileExists,
  readPrivateFile,
} from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";
import {
  down,
  up,
} from "../../../migrations/1790500000000_csv_private_storage";
import type { Database } from "@/server/services/database";
import type { Kysely, Transaction } from "kysely";

/**
 * Runs the migration inside a transaction that is always rolled back, so
 * the shared test database is left as it was. The migration table is
 * dropped first, as `up` creates it.
 */
class Rollback extends Error {}

const inRolledBackTransaction = async (
  fn: (trx: Transaction<Database>) => Promise<void>,
) => {
  try {
    await db.transaction().execute(async (trx) => {
      await sql`DROP TABLE csv_upload_migration`.execute(trx);
      await fn(trx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) {
      throw error;
    }
  }
};

const dataSourceIds: string[] = [];
const localUploads: string[] = [];
const privateKeys: string[] = [];

const createLegacyDataSource = async ({
  trx,
  organisationId,
  url,
}: {
  trx: Kysely<Database>;
  organisationId: string;
  url: string;
}) => {
  // Created (and committed) with a valid config, then given the legacy one
  // inside the transaction, so the rollback restores the valid one
  const dataSource = await createDataSource({
    name: `Legacy CSV ${uuidv4()}`,
    organisationId,
    autoEnrich: false,
    autoImport: false,
    // Unique, or a second insert would wait on the open transaction's
    // uncommitted change to the (config, organisation) unique index
    config: {
      type: DataSourceType.CSV,
      fileKey: createCsvFileKey(organisationId),
    },
    columnDefs: [],
    columnMetadata: [],
    columnRoles: { nameColumns: [] },
    enrichments: [],
    geocodingConfig: { type: GeocodingType.None },
    public: false,
    recordType: DataSourceRecordType.Data,
  });
  dataSourceIds.push(dataSource.id);
  await sql`
    UPDATE data_source
    SET config = ${JSON.stringify({ type: "csv", url })}::jsonb
    WHERE id = ${dataSource.id}
  `.execute(trx);
  return dataSource;
};

const findConfig = async (trx: Kysely<Database>, id: string) => {
  const row = await trx
    .selectFrom("dataSource")
    .where("id", "=", id)
    .select("config")
    .executeTakeFirstOrThrow();
  return row.config;
};

const writeLocalUpload = async (contents: string) => {
  // A space, as in real upload names, to check URL decoding
  const filename = `legacy upload_${Date.now()}_${uuidv4()}.csv`;
  await fs.mkdir(join(getBaseDir(), "uploads"), { recursive: true });
  await fs.writeFile(join(getBaseDir(), "uploads", filename), contents);
  localUploads.push(filename);
  return filename;
};

describe("csv_private_storage migration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("refuses to move uploads in a remote MinIO when not on Render", async () => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });
    const filename = await writeLocalUpload("a\n1\n");

    await inRolledBackTransaction(async (trx) => {
      await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url: `/api/upload/${encodeURIComponent(filename)}`,
      });

      vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
      vi.stubEnv("RENDER", "");
      await expect(up(trx)).rejects.toThrow("Refusing to move CSVs");

      // Migrated locally, then rolled back against the remote MinIO
      vi.unstubAllEnvs();
      await up(trx);
      const log = await trx
        .selectFrom("csvUploadMigration")
        .select("fileKey")
        .execute();
      for (const row of log) {
        privateKeys.push(row.fileKey);
      }
      vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
      vi.stubEnv("RENDER", "");
      await expect(down(trx)).rejects.toThrow("Refusing to move CSVs");
    });
  });

  test("migrates sample files against a remote MinIO", async () => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });

    await inRolledBackTransaction(async (trx) => {
      const sample = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url: "file://resources/dataSets/ge2024.csv",
      });

      // Nothing to copy, so a new or test database migrates anywhere
      vi.stubEnv("MINIO_DOMAIN", "minio.example.com");
      vi.stubEnv("RENDER", "");
      await up(trx);

      expect(await findConfig(trx, sample.id)).toEqual({
        type: "csv",
        fileKey: "sample/ge2024.csv",
      });
    });
  });

  test("moves local uploads and sample files to file keys", async () => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });
    const filename = await writeLocalUpload("name,value\nA,1\n");

    await inRolledBackTransaction(async (trx) => {
      const local = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url: `/api/upload/${encodeURIComponent(filename)}`,
      });
      const sample = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url: `file://resources/dataSets/sampleMembers.csv?orgId=${organisation.id}`,
      });

      await up(trx);

      const localConfig = await findConfig(trx, local.id);
      expect(localConfig.type).toBe("csv");
      expect(Object.keys(localConfig).sort()).toEqual(["fileKey", "type"]);
      if (localConfig.type !== "csv") return;
      privateKeys.push(localConfig.fileKey);
      expect(localConfig.fileKey).toMatch(
        new RegExp(`^${organisation.id}/[0-9a-f]{32}\\.csv$`),
      );
      expect((await readPrivateFile(localConfig.fileKey)).toString()).toBe(
        "name,value\nA,1\n",
      );

      expect(await findConfig(trx, sample.id)).toEqual({
        type: "csv",
        fileKey: "sample/sampleMembers.csv",
      });

      // The public copy is kept until deleteLegacyPublicCsvs runs
      await expect(
        fs.access(join(getBaseDir(), "uploads", filename)),
      ).resolves.toBeUndefined();

      const log = await trx
        .selectFrom("csvUploadMigration")
        .where("dataSourceId", "in", [local.id, sample.id])
        .selectAll()
        .execute();
      expect(log).toHaveLength(2);
      const localLog = log.find((row) => row.dataSourceId === local.id);
      expect(localLog?.legacyLocalFile).toBe(filename);
      expect(localLog?.fileKey).toBe(localConfig.fileKey);
      expect(localLog?.legacyDeletedAt).toBeNull();
    });
  });

  test.each([
    "file://../../.env",
    "file://tests/resources/stats.csv",
    "https://example.com/members.csv",
    "/api/upload/..%2F.env",
  ])("refuses to migrate the URL %s", async (url) => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });

    await inRolledBackTransaction(async (trx) => {
      const dataSource = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url,
      });
      await expect(up(trx)).rejects.toThrow(`${dataSource.id}: ${url}`);
    });
  });

  test("down restores the old URLs and removes the private copies", async () => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });
    const filename = await writeLocalUpload("a\n1\n");
    const url = `/api/upload/${encodeURIComponent(filename)}`;

    await inRolledBackTransaction(async (trx) => {
      const dataSource = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url,
      });
      await up(trx);
      const migrated = await findConfig(trx, dataSource.id);
      if (migrated.type !== "csv") throw new Error("Expected a CSV config");

      await down(trx);

      expect(await findConfig(trx, dataSource.id)).toEqual({
        type: "csv",
        url,
      });
      expect(await privateFileExists(migrated.fileKey)).toBe(false);

      // up creates the table again, so the rollback has something to restore
      await up(trx);
      const remigrated = await findConfig(trx, dataSource.id);
      if (remigrated.type === "csv") privateKeys.push(remigrated.fileKey);
    });
  });

  test("down refuses once the public copies have been deleted", async () => {
    const organisation = await upsertOrganisation({
      name: `Migration Org ${uuidv4()}`,
    });
    const filename = await writeLocalUpload("a\n1\n");

    await inRolledBackTransaction(async (trx) => {
      const dataSource = await createLegacyDataSource({
        trx,
        organisationId: organisation.id,
        url: `/api/upload/${encodeURIComponent(filename)}`,
      });
      await up(trx);
      const migrated = await findConfig(trx, dataSource.id);
      if (migrated.type === "csv") privateKeys.push(migrated.fileKey);
      await trx
        .updateTable("csvUploadMigration")
        .set({ legacyDeletedAt: new Date() })
        .where("dataSourceId", "=", dataSource.id)
        .execute();

      await expect(down(trx)).rejects.toThrow("Restore from a backup");
    });
  });

  test.skipIf(!isMinioConfigured())(
    "moves files from the public MinIO bucket",
    async () => {
      const organisation = await upsertOrganisation({
        name: `Migration Org ${uuidv4()}`,
      });
      const objectName = `legacy upload_${Date.now()}_${uuidv4()}.csv`;
      await getClient().putObject(
        PUBLIC_BUCKET,
        objectName,
        Buffer.from("x,y\n1,2\n"),
      );
      const url = new URL(
        `${PUBLIC_BUCKET}/${objectName}`,
        getMinioOrigin(),
      ).toString();

      await inRolledBackTransaction(async (trx) => {
        const dataSource = await createLegacyDataSource({
          trx,
          organisationId: organisation.id,
          url,
        });
        await up(trx);
        const config = await findConfig(trx, dataSource.id);
        if (config.type !== "csv") throw new Error("Expected a CSV config");
        privateKeys.push(config.fileKey);
        expect((await readPrivateFile(config.fileKey)).toString()).toBe(
          "x,y\n1,2\n",
        );
      });

      await getClient().removeObject(PUBLIC_BUCKET, objectName);
    },
  );
});

afterAll(async () => {
  for (const id of dataSourceIds) {
    await deleteDataSource(id);
  }
  for (const filename of localUploads) {
    await fs.rm(join(getBaseDir(), "uploads", filename), { force: true });
  }
  for (const key of privateKeys) {
    await deletePrivateFile(key);
  }
});
