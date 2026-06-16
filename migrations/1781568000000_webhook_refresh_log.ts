/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("webhookRefreshLog")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("runId", "uuid", (col) => col.notNull())
    .addColumn("dataSourceId", "uuid", (col) =>
      col.notNull().references("dataSource.id").onDelete("cascade"),
    )
    .addColumn("dataSourceType", "text", (col) => col.notNull())
    .addColumn("enabled", "boolean", (col) => col.notNull())
    .addColumn("success", "boolean", (col) => col.notNull())
    .addColumn("action", "text", (col) => col.notNull())
    .addColumn("oldWebhookIds", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("newWebhookIds", "jsonb", (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn("details", "jsonb")
    .addColumn("error", "text")
    .addColumn("createdAt", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex("webhookRefreshLogDataSourceIdCreatedAtIndex")
    .on("webhookRefreshLog")
    .columns(["dataSourceId", "createdAt"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("webhookRefreshLog").execute();
}
