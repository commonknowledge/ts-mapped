/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "data_source"
    ADD COLUMN "default_inspector_config" jsonb DEFAULT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "data_source"
    DROP COLUMN "default_inspector_config"
  `.execute(db);
}
