/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

// Adds `recordType` to existing Action Network data source configs. Every
// pre-existing source imported people, so backfill "people". New sources set
// this explicitly at creation time.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE data_source
    SET config = config || '{"recordType":"people"}'::jsonb
    WHERE config->>'type' = 'actionnetwork'
      AND config->>'recordType' IS NULL;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE data_source
    SET config = config - 'recordType'
    WHERE config->>'type' = 'actionnetwork';
  `.execute(db);
}
