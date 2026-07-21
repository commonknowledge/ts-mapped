/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Remove the "yearColumn" column role. The map timeline filters by month,
 * which needs a real date, so the date column role is the single source of
 * record time (plain 4-digit year values are still accepted, as January).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE data_source
    SET column_roles = column_roles - 'yearColumn'
    WHERE column_roles ? 'yearColumn'
  `.execute(db);
}

export async function down(): Promise<void> {
  // Irreversible: which column was the year column is not recorded elsewhere
}
