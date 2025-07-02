/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("placedMarker")
    .addColumn("id", "bigserial", (col) => col.notNull())
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

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("placedMarker").execute();
}
