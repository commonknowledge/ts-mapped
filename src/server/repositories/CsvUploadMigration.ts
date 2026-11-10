import { sql } from "kysely";
import { CSV_PRIVATE_STORAGE_MIGRATION } from "@/constants";
import { db } from "@/server/services/database";

export function findCsvUploadMigrationsWithLegacyCopies() {
  return db
    .selectFrom("csvUploadMigration")
    .where("legacyDeletedAt", "is", null)
    .selectAll()
    .orderBy("migratedAt")
    .execute();
}

export function findAllCsvUploadMigrations() {
  return db.selectFrom("csvUploadMigration").selectAll().execute();
}

export async function markCsvUploadLegacyCopyDeleted(dataSourceId: string) {
  await db
    .updateTable("csvUploadMigration")
    .set({ legacyDeletedAt: new Date() })
    .where("dataSourceId", "=", dataSourceId)
    .execute();
}

export async function isCsvPrivateStorageMigrationApplied() {
  // kysely_migration is managed by Kysely, so isn't in the Database type
  const { rows } = await sql<{ name: string }>`
    SELECT name FROM kysely_migration
    WHERE name = ${CSV_PRIVATE_STORAGE_MIGRATION}
  `.execute(db);
  return rows.length > 0;
}

/**
 * For seedLegacyCsvUploads only: gives a data source a config in the shape
 * used before the csv_private_storage migration, which the current types
 * (rightly) no longer allow.
 */
export async function setLegacyCsvUrlForSeed({
  dataSourceId,
  url,
}: {
  dataSourceId: string;
  url: string;
}) {
  const config = { type: "csv", url };
  await sql`
    UPDATE data_source
    SET config = ${JSON.stringify(config)}::jsonb
    WHERE id = ${dataSourceId}
  `.execute(db);
}
