/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'data_record'::regclass AND contype = 'p'
      ) THEN
        ALTER TABLE "data_record" ADD PRIMARY KEY ("id");
      END IF;
    END $$
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "data_record" DROP CONSTRAINT "data_record_pkey"`.execute(
    db,
  );
}
