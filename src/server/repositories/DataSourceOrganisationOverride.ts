import { db } from "@/server/services/database";
import type { ColumnMetadata } from "@/models/DataSource";

export async function findDataSourceOrganisationOverride(
  organisationId: string,
  dataSourceId: string,
) {
  const row = await db
    .selectFrom("dataSourceOrganisationOverride")
    .where("organisationId", "=", organisationId)
    .where("dataSourceId", "=", dataSourceId)
    .selectAll()
    .executeTakeFirst();
  return row ?? null;
}

export async function findDataSourceOrganisationOverridesByOrg(
  organisationId: string,
  dataSourceIds: string[],
) {
  if (!dataSourceIds.length) return [];
  return db
    .selectFrom("dataSourceOrganisationOverride")
    .where("organisationId", "=", organisationId)
    .where("dataSourceId", "in", dataSourceIds)
    .selectAll()
    .execute();
}

export async function upsertDataSourceOrganisationOverride(
  organisationId: string,
  dataSourceId: string,
  columnMetadata: ColumnMetadata[],
) {
  return db
    .insertInto("dataSourceOrganisationOverride")
    .values({ organisationId, dataSourceId, columnMetadata })
    .onConflict((oc) =>
      oc
        .columns(["organisationId", "dataSourceId"])
        .doUpdateSet({ columnMetadata }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
