/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "data_source"
    SET "column_metadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'colorMappings'
          THEN jsonb_set(col - 'colorMappings', '{valueColors}', col->'colorMappings')
          ELSE col
        END
      )
      FROM jsonb_array_elements("column_metadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("column_metadata") AS col WHERE col ? 'colorMappings'
    )
  `.execute(db);

  await sql`
    UPDATE "data_source_organisation_override"
    SET "column_metadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'colorMappings'
          THEN jsonb_set(col - 'colorMappings', '{valueColors}', col->'colorMappings')
          ELSE col
        END
      )
      FROM jsonb_array_elements("column_metadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("column_metadata") AS col WHERE col ? 'colorMappings'
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "data_source"
    SET "column_metadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'valueColors'
          THEN jsonb_set(col - 'valueColors', '{colorMappings}', col->'valueColors')
          ELSE col
        END
      )
      FROM jsonb_array_elements("column_metadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("column_metadata") AS col WHERE col ? 'valueColors'
    )
  `.execute(db);

  await sql`
    UPDATE "data_source_organisation_override"
    SET "column_metadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'valueColors'
          THEN jsonb_set(col - 'valueColors', '{colorMappings}', col->'valueColors')
          ELSE col
        END
      )
      FROM jsonb_array_elements("column_metadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("column_metadata") AS col WHERE col ? 'valueColors'
    )
  `.execute(db);
}
