/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .renameColumn("enrichmentConfig", "enrichmentColumns")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .renameColumn("enrichmentColumns", "enrichmentConfig")
    .execute();
}
