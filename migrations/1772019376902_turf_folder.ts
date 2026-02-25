/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("folder")
    .addColumn("type", "text", (col) => col.notNull().defaultTo("placedMarker"))
    .execute();

  await db.schema
    .alterTable("turf")
    .addColumn("folderId", "uuid")
    .addColumn("position", sql`double precision`, (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  await db.schema
    .alterTable("turf")
    .addForeignKeyConstraint("turfFolderIdFKey", ["folderId"], "folder", ["id"])
    .onDelete("restrict")
    .onUpdate("cascade")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("turf")
    .dropColumn("folderId")
    .dropColumn("position")
    .execute();
  await db.schema.dropTable("folder").execute();
}
