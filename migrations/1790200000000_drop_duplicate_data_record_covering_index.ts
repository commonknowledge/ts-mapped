/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

/**
 * Drop a duplicate of data_record_source_id_covering_id.
 *
 * Production has two identical indexes, both
 * btree (data_source_id) INCLUDE (id), 350 MB each:
 *
 *   data_record_source_id_covering_id  - created by migration
 *                                        1770310811295_data_record_id_covering_index
 *   idx_data_record_source_id_covering - created by hand; it appears nowhere
 *                                        in this repo's history
 *
 * Identical definitions give the planner nothing to choose between. The
 * hand-made one had 7 scans against 3,123 for the migration one (stats since
 * 2026-04-08), and it backs no constraint. Dropping it frees ~350 MB and
 * removes one index to maintain on every data_record write.
 *
 * IF EXISTS: other environments never had it.
 *
 * DROP INDEX takes a brief ACCESS EXCLUSIVE lock on data_record. The drop
 * itself is instant, but it has to wait for running queries on the table to
 * finish, and the migration CLI's 10 s lock_timeout bounds that wait.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_data_record_source_id_covering;`.execute(
    db,
  );
}

export async function down(): Promise<void> {
  // Nothing to restore: the migration-managed data_record_source_id_covering_id
  // is the same index, and recreating the duplicate would reintroduce the waste.
}
