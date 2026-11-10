import * as fs from "fs/promises";
import { basename, join } from "path";
import {
  findAllCsvUploadMigrations,
  findCsvUploadMigrationsWithLegacyCopies,
  markCsvUploadLegacyCopyDeleted,
} from "@/server/repositories/CsvUploadMigration";
import { findDataSourceById } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import {
  assertMinioIsLocalOrOnRender,
  deletePublicObject,
  isMinioConfigured,
  listPublicObjectNames,
  privateFileExists,
} from "@/server/services/minio";
import { getBaseDir } from "@/server/utils";

const isCsvName = (name: string) => name.toLowerCase().endsWith(".csv");

const listLocalUploadCsvs = async () => {
  try {
    const names = await fs.readdir(join(getBaseDir(), "uploads"));
    return names.filter(isCsvName);
  } catch {
    return [];
  }
};

const deleteLocalUpload = async (filename: string) => {
  if (basename(filename) !== filename) {
    throw new Error(`Refusing to delete ${filename}: not a plain file name`);
  }
  await fs.rm(join(getBaseDir(), "uploads", filename), { force: true });
};

/**
 * Deletes the public copies of CSVs that the csv_private_storage migration
 * moved into private storage. Run it once the migration has been checked
 * (see checkCsvDataSources).
 *
 * Without `confirm` it only lists what it would delete.
 *
 * With `includeOrphans` it also deletes CSVs in public storage that no data
 * source refers to, such as files left behind by data sources deleted before
 * the migration. Uploads are only images now, so a CSV there is never needed.
 */
const deleteLegacyPublicCsvs = async ({
  confirm,
  includeOrphans,
}: {
  confirm: boolean;
  includeOrphans: boolean;
}) => {
  assertMinioIsLocalOrOnRender("delete public CSVs");

  const action = confirm ? "Deleting" : "Would delete";
  let failures = 0;

  const migrations = await findCsvUploadMigrationsWithLegacyCopies();
  for (const migration of migrations) {
    const hasLegacyCopy =
      migration.legacyPublicObject || migration.legacyLocalFile;
    if (!hasLegacyCopy) {
      // Sample files have nothing to delete
      if (confirm) {
        await markCsvUploadLegacyCopyDeleted(migration.dataSourceId);
      }
      continue;
    }

    // Never delete the only copy of a file a data source still uses. If the
    // data source has been deleted since, its public copy must go anyway.
    const dataSource = await findDataSourceById(migration.dataSourceId);
    const isPrivateCopyMissing =
      dataSource && !(await privateFileExists(migration.fileKey));
    if (isPrivateCopyMissing) {
      logger.error(
        `Private copy ${migration.fileKey} is missing for data source ${migration.dataSourceId}, not deleting ${migration.legacyUrl}`,
      );
      failures++;
      continue;
    }

    logger.info(
      `${action} public copy for data source ${migration.dataSourceId}: ${migration.legacyUrl}`,
    );
    if (!confirm) {
      continue;
    }
    if (migration.legacyPublicObject) {
      await deletePublicObject(migration.legacyPublicObject);
    }
    if (migration.legacyLocalFile) {
      await deleteLocalUpload(migration.legacyLocalFile);
    }
    await markCsvUploadLegacyCopyDeleted(migration.dataSourceId);
  }

  const allMigrations = await findAllCsvUploadMigrations();
  const migratedPublicObjects = new Set(
    allMigrations.map((m) => m.legacyPublicObject),
  );
  const migratedLocalFiles = new Set(
    allMigrations.map((m) => m.legacyLocalFile),
  );

  const publicCsvs = isMinioConfigured()
    ? (await listPublicObjectNames()).filter(isCsvName)
    : [];
  const orphanPublicCsvs = publicCsvs.filter(
    (name) => !migratedPublicObjects.has(name),
  );
  const orphanLocalCsvs = (await listLocalUploadCsvs()).filter(
    (name) => !migratedLocalFiles.has(name),
  );

  const orphanCount = orphanPublicCsvs.length + orphanLocalCsvs.length;
  if (orphanCount && !includeOrphans) {
    logger.info(
      `Found ${orphanCount} CSV(s) in public storage that no data source refers to. Run again with --include-orphans to delete them:`,
    );
  }
  const orphanAction = includeOrphans ? action : "Found";
  for (const name of orphanPublicCsvs) {
    logger.info(`${orphanAction} orphan public CSV: ${name}`);
    if (confirm && includeOrphans) {
      await deletePublicObject(name);
    }
  }
  for (const name of orphanLocalCsvs) {
    logger.info(`${orphanAction} orphan local CSV: uploads/${name}`);
    if (confirm && includeOrphans) {
      await deleteLocalUpload(name);
    }
  }

  if (!confirm) {
    logger.info("Dry run: nothing was deleted. Run with --confirm to delete.");
  }
  if (failures) {
    throw new Error(
      `${failures} public CSV(s) were kept because their private copy is missing`,
    );
  }
};

export default deleteLegacyPublicCsvs;
