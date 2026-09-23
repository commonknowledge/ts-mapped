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
 * blocks writes to data_record (not reads) for the duration of the build:
 * 3.3 s on a 7 GB, 1.95M-row data_record locally. To avoid even that, build it
 * by hand before deploying and this migration becomes a no-op:
 *
 *   CREATE INDEX CONCURRENTLY IF NOT EXISTS data_record_postcode_idx
 *   ON data_record (data_source_id, (lower(json->>'postcode')));
 *
 * A failed CONCURRENTLY build leaves an INVALID index behind under the same
 * name, which IF NOT EXISTS would silently accept, so drop that first.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'data_record_postcode_idx' AND NOT i.indisvalid
      ) THEN
        DROP INDEX data_record_postcode_idx;
      END IF;
    END $$;
  `.execute(db);
  await sql`
    CREATE INDEX IF NOT EXISTS data_record_postcode_idx
    ON data_record (data_source_id, (lower(json->>'postcode')));
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS data_record_postcode_idx;`.execute(db);
}
