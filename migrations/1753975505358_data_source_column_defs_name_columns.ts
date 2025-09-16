/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
	UPDATE data_source
	SET column_roles = jsonb_build_object(
    'nameColumns', jsonb_build_array(column_roles->>'nameColumn')
  );`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
	UPDATE data_source
  SET column_roles = jsonb_build_object(
    'nameColumn', column_roles->'nameColumns'->>0
  );`.execute(db);
}
