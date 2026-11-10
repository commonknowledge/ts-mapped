import type { ColumnType } from "kysely";

/**
 * Written by the csv_private_storage migration: one row per CSV data source
 * whose file was moved from a public URL into private storage. Used to delete
 * the public copies once the move has been checked.
 */
export interface CsvUploadMigrationTable {
  dataSourceId: string;
  legacyUrl: string;
  legacyPublicObject: string | null;
  legacyLocalFile: string | null;
  fileKey: string;
  migratedAt: ColumnType<Date, never, never>;
  legacyDeletedAt: ColumnType<Date | null, never, Date>;
}
