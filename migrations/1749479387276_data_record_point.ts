/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "data_record"
    ADD COLUMN "geocode_point" geography NULL;
  `.execute(db);

  await sql`CREATE INDEX data_record_geocode_point_gist ON data_record USING GIST (geocode_point)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("dataSource").dropColumn("geocodePoint").execute();
}
