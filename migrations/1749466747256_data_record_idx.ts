/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createIndex("dataRecordDataSourceIdIndex")
    .on("dataRecord")
    .columns(["dataSourceId"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("dataRecordDataSourceIdIndex").execute();
}
