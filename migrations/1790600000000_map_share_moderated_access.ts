/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Shared private maps use the same moderated access as public maps:
 * visitors request access by email, a moderator approves, and approved
 * visitors receive a magic link. Passwords are removed.
 *
 * - `public_map_access` becomes `map_access`, for both kinds of map. Each
 *   row is for exactly one of a public map (`public_map_id`) or a map share
 *   (`map_share_id`), one row per (target, email).
 * - `public_map_access_token` becomes `map_access_token`.
 * - `map_share` loses `password_hash` and `password_updated_at`, and gains
 *   `moderator_emails`. Existing shares have no moderators, so nobody could
 *   approve a request: they are disabled until an editor adds moderators.
 *
 * Constraint and index names keep their public_map_access prefix: they are
 * only names, and differ between environments migrated from earlier drafts.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("publicMapAccess").renameTo("mapAccess").execute();

  await db.schema
    .alterTable("mapAccess")
    .alterColumn("publicMapId", (col) => col.dropNotNull())
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .addColumn("mapShareId", "uuid")
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .addForeignKeyConstraint(
      "mapAccessMapShareIdFKey",
      ["mapShareId"],
      "mapShare",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .addUniqueConstraint("mapAccessMapShareIdEmailKey", ["mapShareId", "email"])
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .addCheckConstraint(
      "mapAccessOneTargetCheck",
      sql`num_nonnulls(public_map_id, map_share_id) = 1`,
    )
    .execute();

  await db.schema
    .alterTable("publicMapAccessToken")
    .renameTo("mapAccessToken")
    .execute();
  await db.schema
    .alterTable("mapAccessToken")
    .renameColumn("publicMapAccessId", "mapAccessId")
    .execute();

  await db.schema
    .alterTable("mapShare")
    .dropColumn("passwordHash")
    .dropColumn("passwordUpdatedAt")
    .addColumn("moderatorEmails", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .execute();
  await db.updateTable("mapShare").set({ enabled: false }).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("mapShare")
    .dropColumn("moderatorEmails")
    .addColumn("passwordHash", "text")
    .addColumn("passwordUpdatedAt", "timestamp")
    .execute();

  await db.schema
    .alterTable("mapAccessToken")
    .renameColumn("mapAccessId", "publicMapAccessId")
    .execute();
  await db.schema
    .alterTable("mapAccessToken")
    .renameTo("publicMapAccessToken")
    .execute();

  // Share access rows have no public map, so cannot survive the NOT NULL
  await db
    .deleteFrom("mapAccess")
    .where("mapShareId", "is not", null)
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .dropConstraint("mapAccessOneTargetCheck")
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .dropConstraint("mapAccessMapShareIdEmailKey")
    .execute();
  await db.schema
    .alterTable("mapAccess")
    .dropConstraint("mapAccessMapShareIdFKey")
    .execute();
  await db.schema.alterTable("mapAccess").dropColumn("mapShareId").execute();
  await db.schema
    .alterTable("mapAccess")
    .alterColumn("publicMapId", (col) => col.setNotNull())
    .execute();
  await db.schema.alterTable("mapAccess").renameTo("publicMapAccess").execute();
}
