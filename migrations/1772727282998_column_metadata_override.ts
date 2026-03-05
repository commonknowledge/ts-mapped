/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("columnMetadataOverride")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("organisationId", "uuid", (col) =>
      col
        .notNull()
        .references("organisation.id")
        .onDelete("cascade")
        .onUpdate("cascade"),
    )
    .addColumn("dataSourceId", "uuid", (col) =>
      col
        .notNull()
        .references("dataSource.id")
        .onDelete("cascade")
        .onUpdate("cascade"),
    )
    .addColumn("columnMetadata", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .addUniqueConstraint("column_metadata_override_org_ds_unique", [
      "organisationId",
      "dataSourceId",
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("columnMetadataOverride").execute();
}
