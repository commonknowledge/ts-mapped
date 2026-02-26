/* eslint-disable @typescript-eslint/no-explicit-any */

import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX data_record_source_id_covering_id ON data_record(data_source_id) INCLUDE (id);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS data_record_source_id_covering_id;`.execute(
    db,
  );
}
