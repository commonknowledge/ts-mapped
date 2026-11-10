import * as fs from "fs/promises";
import { basename, join } from "path";
import { DataSourceType } from "@/models/DataSource";
import { CSVAdaptor } from "@/server/adaptors/csv";
import { findAllCsvUploadMigrations } from "@/server/repositories/CsvUploadMigration";
import { countDataRecordsForDataSource } from "@/server/repositories/DataRecord";
import { findDataSourcesByType } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";

/**
 * Whether the old URL of a migrated CSV still serves the file to anyone
 * without logging in. This should be true after the migration and false once
 * deleteLegacyPublicCsvs has run.
 */
const isLegacyCopyReachable = async (legacyUrl: string) => {
  if (legacyUrl.startsWith("/api/upload/")) {
    const filename = basename(legacyUrl);
    return fs.access(join(getBaseDir(), "uploads", filename)).then(
      () => true,
      () => false,
    );
  }
  if (!legacyUrl.startsWith("http")) {
    return false;
  }
  try {
    const response = await fetch(legacyUrl);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Read-only: for every CSV data source, checks its file can be read from
 * private storage and compares the file's row count with the records in the
 * database. Also reports whether the public copies left by the
 * csv_private_storage migration can still be downloaded.
 *
 * Exits with an error if any file can't be read.
 */
const checkCsvDataSources = async () => {
  const dataSources = await findDataSourcesByType(DataSourceType.CSV);
  const migrations = await findAllCsvUploadMigrations();
  const migrationsByDataSourceId = new Map(
    migrations.map((m) => [m.dataSourceId, m]),
  );

  let failures = 0;
  for (const dataSource of dataSources) {
    if (dataSource.config.type !== DataSourceType.CSV) {
      continue;
    }
    const label = `${dataSource.name} (${dataSource.id})`;
    const { total } = await countDataRecordsForDataSource(
      dataSource.id,
      null,
      null,
    );

    let fileRows: number;
    try {
      const adaptor = new CSVAdaptor(dataSource.config.fileKey);
      fileRows = await adaptor.getRecordCount();
    } catch (error) {
      failures++;
      logger.error(`FAIL ${label}: can't read ${dataSource.config.fileKey}`, {
        error,
      });
      continue;
    }

    const migration = migrationsByDataSourceId.get(dataSource.id);
    let legacyStatus = "";
    const hadPublicCopy = Boolean(
      migration?.legacyPublicObject || migration?.legacyLocalFile,
    );
    if (migration && hadPublicCopy) {
      const isReachable = await isLegacyCopyReachable(migration.legacyUrl);
      legacyStatus = isReachable
        ? `; old URL still serves the file publicly: ${migration.legacyUrl}`
        : "; old URL no longer serves the file";
    }

    // A file that hasn't been imported yet has records = 0, which is fine
    logger.info(
      `OK ${label}: ${fileRows} rows in file, ${total} records in database${legacyStatus}`,
    );
  }

  logger.info(
    `Checked ${dataSources.length} CSV data source(s), ${failures} failed`,
  );
  if (failures) {
    throw new Error(`${failures} CSV data source(s) can't be read`);
  }
};

export default checkCsvDataSources;
