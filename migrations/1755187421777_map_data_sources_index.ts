/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createIndex("idx_map_config_member_data_source_id")
    .on("map")
    .using("gin")
    .expression(sql`(config->'memberDataSourceId')`)
    .execute();
  await db.schema
    .createIndex("idx_map_config_marker_data_source_ids")
    .on("map")
    .using("gin")
    .expression(sql`(config->'markerDataSourceIds')`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_map_config_marker_data_source_ids").execute();
  await db.schema.dropIndex("idx_map_config_member_data_source_id").execute();
}
