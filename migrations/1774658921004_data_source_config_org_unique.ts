/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropConstraint("data_source_config_key")
    .execute();
  await db.schema
    .alterTable("dataSource")
    .addUniqueConstraint("data_source_config_organisation_id_key", [
      "config",
      "organisationId",
    ])
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .dropConstraint("data_source_config_organisation_id_key")
    .execute();
  await db.schema
    .alterTable("dataSource")
    .addUniqueConstraint("data_source_config_key", ["config"])
    .execute();
}
