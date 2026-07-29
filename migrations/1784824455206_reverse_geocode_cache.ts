/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

/**
 * Support Mapbox geocoding-context enrichment columns:
 * - New reverse_geocode_cache table, keyed by rounded coordinates, caching
 *   the reverse-geocode context object. Mirrors geocode_cache's 4-week TTL to
 *   stay within Mapbox's Temporary Geocoding storage terms.
 * - New context column on geocode_cache so re-imports of address sources reuse
 *   the forward-geocode context instead of re-fetching it.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("reverseGeocodeCache")
    .addColumn("key", "text", (col) => col.primaryKey())
    .addColumn("context", "jsonb")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .alterTable("geocodeCache")
    .addColumn("context", "jsonb")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("geocodeCache").dropColumn("context").execute();
  await db.schema.dropTable("reverseGeocodeCache").execute();
}
