/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("columnMetadataOverride")
    .renameTo("dataSourceOrganisationOverride")
    .execute();

  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .addColumn("columnVisualisations", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .dropColumn("columnVisualisations")
    .execute();

  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .renameTo("columnMetadataOverride")
    .execute();
}
