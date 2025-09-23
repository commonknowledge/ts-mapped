/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("turf")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("notes", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("area", sql`double precision`, (col) => col.notNull())
    .addColumn("geometry", "jsonb", (col) => col.notNull())
    .addColumn("createdAt", sql`TIMESTAMP`, (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addForeignKeyConstraint("turfMapIdFKey", ["mapId"], "map", ["id"], (cb) =>
      cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("turf").execute();
}
