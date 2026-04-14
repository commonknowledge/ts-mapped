/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely, sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("user").addColumn("role", "text").execute();
  await sql`UPDATE "user" SET role = 'Superadmin' WHERE email = 'hello@commonknowledge.coop'`.execute(
    db,
  );
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("user").dropColumn("role").execute();
}
