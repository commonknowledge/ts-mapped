/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`TRUNCATE TABLE turf`.execute(db);
  await db.schema.alterTable("turf").dropColumn("geometry").execute();
  await sql`
		ALTER TABLE "turf"
		ADD COLUMN "polygon" geography NOT NULL;
	`.execute(db);

  await sql`CREATE INDEX turf_polygon_gist ON turf USING GIST (polygon)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("turf")
    .dropColumn("polygon")
    .addColumn("geometry", "jsonb", (c) => c.notNull())
    .execute();
}
