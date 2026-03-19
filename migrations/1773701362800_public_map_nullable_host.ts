/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop the existing unique constraint on host
  await db.schema
    .alterTable("publicMap")
    .dropConstraint("public_map_host_key")
    .execute();

  // Make host nullable
  await db.schema
    .alterTable("publicMap")
    .alterColumn("host", (col) => col.dropNotNull())
    .execute();

  // Convert existing empty-string hosts to NULL
  await sql`UPDATE "public_map" SET "host" = NULL WHERE "host" = ''`.execute(
    db,
  );

  // Add a partial unique index: uniqueness only enforced for non-null hosts
  await sql`CREATE UNIQUE INDEX "public_map_host_key" ON "public_map" ("host") WHERE "host" IS NOT NULL`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the partial unique index
  await db.schema.dropIndex("public_map_host_key").execute();

  // Convert NULLs back to empty strings
  await sql`UPDATE "public_map" SET "host" = '' WHERE "host" IS NULL`.execute(
    db,
  );

  // Restore NOT NULL
  await db.schema
    .alterTable("publicMap")
    .alterColumn("host", (col) => col.setNotNull())
    .execute();

  // Restore the original unique constraint
  await db.schema
    .alterTable("publicMap")
    .addUniqueConstraint("public_map_host_key", ["host"])
    .execute();
}
