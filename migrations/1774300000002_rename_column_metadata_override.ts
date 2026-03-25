import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE column_metadata_override RENAME TO data_source_organisation_override`.execute(
    db,
  );
  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .addColumn("inspectorColumns", "jsonb", (col) =>
      col.notNull().defaultTo("[]"),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("dataSourceOrganisationOverride")
    .dropColumn("inspectorColumns")
    .execute();
  await sql`ALTER TABLE data_source_organisation_override RENAME TO column_metadata_override`.execute(
    db,
  );
}
