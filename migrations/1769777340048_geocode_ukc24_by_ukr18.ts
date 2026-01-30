/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Set data_record.geocode_result->'areas'->'UKC24' to:
  // case data_record.geocode_result->'areas'->'UKR18' starts with 'E': E92000001
  // case data_record.geocode_result->'areas'->'UKR18' starts with 'W': W92000004
  // case data_record.geocode_result->'areas'->'UKR18' starts with 'S': S92000003
  // case data_record.geocode_result->'areas'->'UKR18' starts with 'N': N92000002
  await db
    .updateTable("data_record")
    .set({
      geocode_result: sql`jsonb_set(
				geocode_result,
				'{areas,UKC24}',
				to_jsonb(
					CASE 
						WHEN geocode_result->'areas'->>'UKR18' LIKE 'E%' THEN 'E92000001'
						WHEN geocode_result->'areas'->>'UKR18' LIKE 'W%' THEN 'W92000004'
						WHEN geocode_result->'areas'->>'UKR18' LIKE 'S%' THEN 'S92000003'
						WHEN geocode_result->'areas'->>'UKR18' LIKE 'N%' THEN 'N92000002'
					END
				)
			)`,
    })
    .where(sql<boolean>`geocode_result->'areas' ? 'UKR18'`)
    .where(sql<boolean>`geocode_result->'areas'->>'UKR18' ~ '^[EWSN]'`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // remove "UKC24" key from data_record.geocode_result->'areas'
  await db
    .updateTable("data_record")
    .set({
      geocode_result: sql`geocode_result #- '{areas,UKC24}'`,
    })
    .where(sql<boolean>`geocode_result->'areas' ? 'UKC24'`)
    .execute();
}
