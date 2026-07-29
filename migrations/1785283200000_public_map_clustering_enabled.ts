/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Public maps can now turn marker clustering on or off. Existing maps always
 * clustered, so the column (and any unpublished draft) defaults to true.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("publicMap")
    .addColumn("clusteringEnabled", "boolean", (col) =>
      col.notNull().defaultTo(true),
    )
    .execute();

  await sql`
    UPDATE public_map
    SET draft = draft || '{"clusteringEnabled": true}'::jsonb
    WHERE draft IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE public_map
    SET draft = draft - 'clusteringEnabled'
    WHERE draft IS NOT NULL
  `.execute(db);

  await db.schema
    .alterTable("publicMap")
    .dropColumn("clusteringEnabled")
    .execute();
}
