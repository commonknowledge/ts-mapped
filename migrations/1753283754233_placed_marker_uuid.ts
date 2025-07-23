/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("placedMarker").execute();

  await db.schema
    .createTable("placedMarker")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("notes", "text", (col) => col.notNull().defaultTo(""))
    .addForeignKeyConstraint(
      "placedMarkerMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();

  await sql`
		ALTER TABLE "placed_marker"
		ADD COLUMN "point" geography NOT NULL;
	`.execute(db);

  await sql`CREATE INDEX placed_marker_point_gist ON placed_marker USING GIST (point)`.execute(
    db,
  );
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("placedMarker").execute();

	await db.schema
    .createTable("placedMarker")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("notes", "text", (col) => col.notNull().defaultTo(""))
    .addForeignKeyConstraint(
      "placedMarkerMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();

  await sql`
		ALTER TABLE "placed_marker"
		ADD COLUMN "point" geography NOT NULL;
	`.execute(db);

  await sql`CREATE INDEX placed_marker_point_gist ON placed_marker USING GIST (point)`.execute(
    db,
  );
}
