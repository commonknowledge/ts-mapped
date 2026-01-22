/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
			UPDATE map_view
			SET inspector_config = jsonb_set(
				inspector_config,
				'{boundaries}',
				(
					SELECT COALESCE(
						jsonb_agg(
							jsonb_set(
								boundary,
								'{id}',
								to_jsonb(gen_random_uuid()::text)
							)
						),
						'[]'::jsonb
					)
					FROM jsonb_array_elements(inspector_config->'boundaries') AS boundary
				)
			)
			WHERE inspector_config ? 'boundaries'
			AND jsonb_typeof(inspector_config->'boundaries') = 'array'
		`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
			UPDATE map_view
			SET inspector_config = jsonb_set(
				inspector_config,
				'{boundaries}',
				(
					SELECT COALESCE(
						jsonb_agg(boundary - 'id'),
						'[]'::jsonb
					)
					FROM jsonb_array_elements(inspector_config->'boundaries') AS boundary
				)
			)
			WHERE inspector_config ? 'boundaries'
			AND jsonb_typeof(inspector_config->'boundaries') = 'array'
		`.execute(db);
}
