/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

/**
 * Index postcode look-ups on data_record.
 *
 * The expression matches what FilterType.EXACT generates in
 * src/server/repositories/DataRecord.ts — lower(json->>column) = search — so
 * `?filter={"type":"EXACT","column":"postcode","search":"LS1 1AA"}` becomes an
 * index scan instead of a sequential scan over every record in the source.
 *
 * Deliberately NOT a partial index (WHERE json ? 'postcode'): the EXACT
 * predicate doesn't imply that condition, so the planner can't use a partial
 * index for it and silently falls back to the sequential scan.
 *
 * Not CONCURRENTLY, because migrations run inside a transaction. Building it
 * blocks writes to data_record (not reads) for the duration of the build.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS data_record_postcode_idx
    ON data_record (data_source_id, (lower(json->>'postcode')));
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS data_record_postcode_idx;`.execute(db);
}
