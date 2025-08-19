import { sql } from "kysely";
import { JobInfo, JobStatus } from "@/__generated__/types";
import { DataSourceUpdate, NewDataSource } from "@/server/models/DataSource";
import { db } from "@/server/services/database";
import { DataSourceType } from "@/types";

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

export async function getJobInfo(
  dataSourceId: string,
  task: string,
): Promise<JobInfo> {
  const latestJob = await db
    .selectFrom("pgboss.job")
    .where(sql`data->>'task'`, "=", task)
    .where(sql`data->'args'->>'dataSourceId'`, "=", dataSourceId)
    .orderBy("completedOn", "desc")
    .limit(1)
    .selectAll()
    .executeTakeFirst();

  if (!latestJob) {
    return {
      status: JobStatus.None,
    };
  }

  if (latestJob.state === "failed") {
    return {
      status: JobStatus.Failed,
    };
  }

  if (!latestJob.startedOn) {
    return {
      status: JobStatus.Pending,
    };
  }

  if (!latestJob.completedOn) {
    return {
      status: JobStatus.Running,
    };
  }

  return {
    lastCompleted: latestJob.completedOn.toISOString(),
    status: JobStatus.Complete,
  };
}

export async function findDataSourceById(id: string) {
  return await db
    .selectFrom("dataSource")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function findDataSourceByIdAndOwnerId(id: string, userId: string) {
  return db
    .selectFrom("dataSource")
    .innerJoin("organisation", "dataSource.organisationId", "organisation.id")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId",
    )
    .where("dataSource.id", "=", id)
    .where("organisationUser.userId", "=", userId)
    .selectAll("dataSource")
    .execute();
}

export async function findDataSourcesByIds(ids: string[]) {
  if (!ids.length) {
    return [];
  }
  return await db
    .selectFrom("dataSource")
    .where("id", "in", ids)
    .selectAll()
    .execute();
}

export async function findDataSourcesByType(type: DataSourceType) {
  return await db
    .selectFrom("dataSource")
    .where(({ eb, ref }) => {
      return eb(ref("config", "->>").key("type"), "=", type);
    })
    .selectAll()
    .execute();
}

export function findReadableDataSources(userId: string | null | undefined) {
  return db
    .selectFrom("dataSource")
    .innerJoin("organisation", "dataSource.organisationId", "organisation.id")
    .innerJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId",
    )
    .where((eb) => {
      const filter = [eb("public", "=", true)];
      if (userId) {
        filter.push(eb("organisationUser.userId", "=", userId));
      }
      return eb.or(filter);
    })
    .selectAll("dataSource")
    .execute();
}

export async function findCSVDataSourceByUrl(url: string) {
  return await db
    .selectFrom("dataSource")
    .where(({ eb, ref }) => {
      return eb(ref("config", "->>").key("type"), "=", DataSourceType.csv);
    })
    .where(({ eb, ref }) => {
      return eb(ref("config", "->>").key("url"), "=", url);
    })
    .selectAll()
    .executeTakeFirst();
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
