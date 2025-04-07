/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .renameColumn("enrichmentConfig", "enrichments")
    .execute();
  await db.schema
    .alterTable("dataSource")
    .renameColumn("columnsConfig", "columnRoles")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .renameColumn("enrichments", "enrichmentConfig")
    .execute();
  await db.schema
    .alterTable("dataSource")
    .renameColumn("columnRoles", "columnsConfig")
    .execute();
}
