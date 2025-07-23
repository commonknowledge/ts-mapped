/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Fix existing marker folders that have {} instead of []
  await db
    .updateTable("markerFolder")
    .set({ markerIds: [] })
    .where("markerIds", "=", "{}")
    .execute();

  // 2. Add position column to placedMarker table
  await db.schema
    .alterTable("placedMarker")
    .addColumn("position", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  // Create index on placedMarker position for efficient sorting
  await db.schema
    .createIndex("placed_marker_position_idx")
    .on("placedMarker")
    .columns(["mapId", "position"])
    .execute();

  // 3. Add position column to markerFolder table
  await db.schema
    .alterTable("markerFolder")
    .addColumn("position", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  // Add index for efficient ordering of marker folders
  await db.schema
    .createIndex("markerFolder_position_idx")
    .on("markerFolder")
    .column("position")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop markerFolder position column and index
  await db.schema.dropIndex("markerFolder_position_idx").execute();
  await db.schema.alterTable("markerFolder").dropColumn("position").execute();

  // Drop placedMarker position column and index
  await db.schema.dropIndex("placed_marker_position_idx").execute();
  await db.schema.alterTable("placedMarker").dropColumn("position").execute();

  // Note: We don't revert the markerIds fix as it's a data correction
}
