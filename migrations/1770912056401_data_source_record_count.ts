/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Add record_count column to dataSource table
  await db.schema
    .alterTable("dataSource")
    .addColumn("recordCount", "integer", (col) => col.defaultTo(0).notNull())
    .execute();

  // Populate record_count with actual counts from data_record
  await sql`
		UPDATE "data_source" ds
		SET "record_count" = (
			SELECT count(1)
			FROM "data_record" dr
			WHERE dr."data_source_id" = ds.id
		)
	`.execute(db);
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Remove record_count column from dataSource table
  await db.schema.alterTable("dataSource").dropColumn("recordCount").execute();
}
