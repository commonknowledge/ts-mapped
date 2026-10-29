/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Moderated public maps: visitors request access by email, a moderator
 * approves or rejects, and approved visitors receive a magic link.
 *
 * - `public_map.access_mode`: "Open" (anyone) or "Moderated"
 * - `public_map.moderator_emails`: who is emailed about new requests
 * - `public_map.embed_origins`: the sites (origins) a moderated map may be
 *   embedded on. Requests from embeds on other sites are refused, so a magic
 *   link can only ever point at a listed site or the map's own subdomain.
 * - `public_map_access`: one row per (public map, email). `token_hash` is
 *   the current magic link; `requested_from_url` is the page of a listed
 *   site the latest request came from (null for the map's own address);
 *   `decided_at` invalidates viewer grants minted before the latest
 *   approve/reject/revoke.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("publicMap")
    .addColumn("accessMode", "text", (col) => col.notNull().defaultTo("Open"))
    .addColumn("moderatorEmails", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("embedOrigins", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .execute();

  await sql`
    UPDATE public_map
    SET draft = draft || '{"accessMode": "Open", "moderatorEmails": [], "embedOrigins": []}'::jsonb
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
    .addColumn("requestedFromUrl", "text")
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
    SET draft = draft - 'accessMode' - 'moderatorEmails' - 'embedOrigins'
    WHERE draft IS NOT NULL
  `.execute(db);

  await db.schema
    .alterTable("publicMap")
    .dropColumn("accessMode")
    .dropColumn("moderatorEmails")
    .dropColumn("embedOrigins")
    .execute();
}
