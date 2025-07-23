/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Fix existing marker folders that have {} instead of []
  await db
    .updateTable("markerFolder")
    .set({ markerIds: [] })
    .where("markerIds", "=", "{}")
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(_db: Kysely<any>): Promise<void> {
  // No down migration needed for this fix
}
