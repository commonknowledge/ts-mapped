/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("map")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("organisationId", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("createdAt", sql`TIMESTAMP`, (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addForeignKeyConstraint(
      "mapOrganisationIdFKey",
      ["organisationId"],
      "organisation",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();

  await db.schema
    .alterTable("mapView")
    .dropColumn("organisationId")
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .execute();

  await sql`SET TIME ZONE UTC`.execute(db);

  await sql`
	  ALTER TABLE "map_view"
      ALTER COLUMN "created_at"
			  SET DATA TYPE TIMESTAMP
        USING "created_at"::timestamp with time zone;
	`.execute(db);

  await db.schema
    .alterTable("mapView")
    .addForeignKeyConstraint("mapViewMapIdFKey", ["mapId"], "map", ["id"])
    .onDelete("cascade")
    .onUpdate("cascade")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mapView")
    .dropConstraint("mapViewMapIdFKey")
    .execute();
  await db.schema.dropTable("map").execute();

  await db.schema
    .alterTable("mapView")
    .addColumn("organisationId", "uuid", (col) => col.notNull())
    .dropColumn("mapId")
    .execute();
}
