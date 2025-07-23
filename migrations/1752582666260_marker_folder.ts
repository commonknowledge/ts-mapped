/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("markerFolder")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("markerIds", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`)
    )
    .addColumn("isExpanded", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addColumn("createdAt", sql`TIMESTAMP`, (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addForeignKeyConstraint(
      "markerFolderMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("markerFolder").execute();
}
