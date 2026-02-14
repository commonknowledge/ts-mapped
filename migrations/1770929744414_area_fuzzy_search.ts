/* eslint-disable @typescript-eslint/no-explicit-any */

import { sql } from "kysely";
import type { Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Enable pg_trgm extension for trigram-based fuzzy matching
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  // Create a materialized view that denormalizes area + area_set for efficient searching
  await sql`
    CREATE MATERIALIZED VIEW area_search AS
    SELECT 
      area.id,
      area.code,
      area.name,
      area_set.id as area_set_id,
      area_set.code as area_set_code,
      area_set.name as area_set_name,
      CONCAT_WS(' ', area.name, area.code, area_set.name, area_set.code) as search_text
    FROM area
    INNER JOIN "area_set" area_set ON area."area_set_id" = area_set.id
  `.execute(db);

  // Create a unique index on id for concurrent refresh
  await sql`
    CREATE UNIQUE INDEX area_search_id_idx ON area_search (id)
  `.execute(db);

  // Create GIN trigram index on the search text for fast ILIKE queries
  await sql`
    CREATE INDEX area_search_text_trgm_idx ON area_search 
    USING GIN (search_text gin_trgm_ops)
  `.execute(db);
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS area_search_text_trgm_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS area_search_id_idx`.execute(db);
  await sql`DROP MATERIALIZED VIEW IF EXISTS area_search`.execute(db);
}
