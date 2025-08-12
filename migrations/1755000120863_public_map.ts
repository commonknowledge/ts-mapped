/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("publicMap")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("hostname", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("descriptionLink", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addColumn("viewId", "uuid", (col) => col.notNull())
    .addColumn("published", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addForeignKeyConstraint(
      "publicMapMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .addForeignKeyConstraint(
      "publicMapViewIdFKey",
      ["viewId"],
      "mapView",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("publicMap").execute();
}
