/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`.execute(db);

  sql`
		CREATE OR REPLACE FUNCTION jsonb_values_text(data jsonb)
		RETURNS text AS $$
		BEGIN
			RETURN (
				SELECT string_agg(value, ' ')
				FROM jsonb_each_text(data)
			);
		END;
		$$ LANGUAGE plpgsql IMMUTABLE;
	`.execute(db);

  await db.schema
    .alterTable("dataRecord")
    .addColumn("jsonTextSearch", "text", (col) => {
      return col.generatedAlwaysAs(sql`jsonb_values_text(json)`).stored();
    })
    .execute();

  await db.schema
    .createIndex("dataRecordJsonTextSearchIdx")
    .on("dataRecord")
    .using("gin")
    .expression(sql`json_text_search gin_trgm_ops`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("dataRecordJsonTextSearchIdx").execute();

  await db.schema
    .alterTable("dataRecord")
    .dropColumn("jsonTextSearch")
    .execute();

  await sql`
		DROP FUNCTION IF EXISTS jsonb_values_text(jsonb);
	`.execute(db);
}
