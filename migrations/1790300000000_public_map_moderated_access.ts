/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Moderated public maps: visitors request access by email, a moderator
 * approves or rejects, and approved visitors receive a magic link.
 *
 * - `public_map.access_mode`: "Open" (anyone) or "Moderated"
 * - `public_map.moderator_emails`: who is emailed about new requests
 * - `public_map.embed_url`: the page the map is embedded on, where magic
 *   links point; empty means the map's own subdomain
 * - `public_map_access`: one row per (public map, email). `token_hash` is
 *   the current magic link; `decided_at` invalidates viewer grants minted
 *   before the latest approve/reject/revoke.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("publicMap")
    .addColumn("accessMode", "text", (col) => col.notNull().defaultTo("Open"))
    .addColumn("moderatorEmails", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("embedUrl", "text", (col) => col.notNull().defaultTo(""))
    .execute();

  await sql`
    UPDATE public_map
    SET draft = draft || '{"accessMode": "Open", "moderatorEmails": [], "embedUrl": ""}'::jsonb
    WHERE draft IS NOT NULL
  `.execute(db);

  await db.schema
    .createTable("publicMapAccess")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("publicMapId", "uuid", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("tokenHash", "text", (col) => col.unique())
    .addColumn("tokenIssuedAt", "timestamp")
    .addColumn("decidedAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addUniqueConstraint("publicMapAccessPublicMapIdEmailKey", [
      "publicMapId",
      "email",
    ])
    .addForeignKeyConstraint(
      "publicMapAccessPublicMapIdFKey",
      ["publicMapId"],
      "publicMap",
      ["id"],
      (cb) => cb.onDelete("cascade").onUpdate("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("publicMapAccess").execute();

  await sql`
    UPDATE public_map
    SET draft = draft - 'accessMode' - 'moderatorEmails' - 'embedUrl'
    WHERE draft IS NOT NULL
  `.execute(db);

  await db.schema
    .alterTable("publicMap")
    .dropColumn("accessMode")
    .dropColumn("moderatorEmails")
    .dropColumn("embedUrl")
    .execute();
}
