/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSource")
    .renameColumn("columnVisualisations", "inspectorColumns")
    .execute();

  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .renameColumn("columnVisualisations", "inspectorColumns")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .renameColumn("inspectorColumns", "columnVisualisations")
    .execute();

  await db.schema
    .alterTable("dataSource")
    .renameColumn("inspectorColumns", "columnVisualisations")
    .execute();
}
