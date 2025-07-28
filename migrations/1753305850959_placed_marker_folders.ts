/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("folder")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("mapId", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("notes", "text", (col) => col.notNull().defaultTo(""))
    .addForeignKeyConstraint(
      "folderMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();

  await db.schema
    .alterTable("placedMarker")
    .addColumn("folderId", "uuid")
    .addColumn("position", sql`double precision`, (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  await db.schema
    .alterTable("placedMarker")
    .addForeignKeyConstraint(
      "placedMarkerFolderIdFKey",
      ["folderId"],
      "folder",
      ["id"],
    )
    .onDelete("restrict")
    .onUpdate("cascade")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("placedMarker")
    .dropColumn("folderId")
    .dropColumn("position")
    .execute();
  await db.schema.dropTable("folder").execute();
}
