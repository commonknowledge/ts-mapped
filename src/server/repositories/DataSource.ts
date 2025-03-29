import { sql } from "kysely";
import { ImportInfo, ImportStatus } from "@/__generated__/types";
import { DataSourceUpdate, NewDataSource } from "@/server/models/DataSource";
import { db } from "@/server/services/database";

export async function createDataSource(dataSource: NewDataSource) {
  return await db
    .insertInto("dataSource")
    .values(dataSource)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteDataSource(id: string) {
  return await db
    .deleteFrom("dataSource")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

export async function getImportInfo(id: string): Promise<ImportInfo> {
  const latestJob = await db
    .selectFrom("pgboss.job")
    .where(sql`data->>'task'`, "=", "importDataSource")
    .where(sql`data->'args'->>'dataSourceId'`, "=", id)
    .orderBy("completedOn", "desc")
    .limit(1)
    .selectAll()
    .executeTakeFirst();

  if (!latestJob) {
    return {
      status: ImportStatus.None,
    };
  }

  if (latestJob.state === "failed") {
    return {
      status: ImportStatus.Failed,
    };
  }

  if (!latestJob.startedOn) {
    return {
      status: ImportStatus.Pending,
    };
  }

  if (!latestJob.completedOn) {
    return {
      status: ImportStatus.Importing,
    };
  }

  return {
    lastImported: latestJob.completedOn.toISOString(),
    status: ImportStatus.Imported,
  };
}

export async function findDataSourceById(id: string) {
  return await db
    .selectFrom("dataSource")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function listDataSources() {
  return db.selectFrom("dataSource").selectAll().execute();
}

export async function updateDataSource(
  id: string,
  updateWith: DataSourceUpdate,
) {
  await db
    .updateTable("dataSource")
    .set(updateWith)
    .where("id", "=", id)
    .execute();
}
