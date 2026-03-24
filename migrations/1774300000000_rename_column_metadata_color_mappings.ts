/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "dataSource"
    SET "columnMetadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'colorMappings'
          THEN jsonb_set(col - 'colorMappings', '{valueColors}', col->'colorMappings')
          ELSE col
        END
      )
      FROM jsonb_array_elements("columnMetadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("columnMetadata") AS col WHERE col ? 'colorMappings'
    )
  `.execute(db);

  await sql`
    UPDATE "dataSourceOrganisationOverride"
    SET "columnMetadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'colorMappings'
          THEN jsonb_set(col - 'colorMappings', '{valueColors}', col->'colorMappings')
          ELSE col
        END
      )
      FROM jsonb_array_elements("columnMetadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("columnMetadata") AS col WHERE col ? 'colorMappings'
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE "dataSource"
    SET "columnMetadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'valueColors'
          THEN jsonb_set(col - 'valueColors', '{colorMappings}', col->'valueColors')
          ELSE col
        END
      )
      FROM jsonb_array_elements("columnMetadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("columnMetadata") AS col WHERE col ? 'valueColors'
    )
  `.execute(db);

  await sql`
    UPDATE "dataSourceOrganisationOverride"
    SET "columnMetadata" = (
      SELECT jsonb_agg(
        CASE
          WHEN col ? 'valueColors'
          THEN jsonb_set(col - 'valueColors', '{colorMappings}', col->'valueColors')
          ELSE col
        END
      )
      FROM jsonb_array_elements("columnMetadata") AS col
    )
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements("columnMetadata") AS col WHERE col ? 'valueColors'
    )
  `.execute(db);
}
