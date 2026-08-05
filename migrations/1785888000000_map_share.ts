/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Read-only private map sharing: one share per map, addressed by an
 * unguessable token, optionally protected by a password.
 * `password_updated_at` invalidates viewer grants issued before a
 * password change.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("mapShare")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("mapId", "uuid", (col) => col.notNull().unique())
    .addColumn("token", "text", (col) => col.notNull().unique())
    .addColumn("enabled", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("passwordHash", "text")
    .addColumn("passwordUpdatedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addForeignKeyConstraint(
      "mapShareMapIdFKey",
      ["mapId"],
      "map",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("mapShare").execute();
}
