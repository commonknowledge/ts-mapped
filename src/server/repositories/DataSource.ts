import { sql } from "kysely";
import { DataSourceType, JobStatus } from "@/models/DataSource";
import { db } from "@/server/services/database";
import type { DataSourceUpdate, NewDataSource } from "../models/DataSource";
import type {
  ColumnDef,
  DefaultChoroplethConfig,
  DefaultInspectorConfig,
  JobInfo,
} from "@/models/DataSource";

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
    lastCompleted: latestJob.completedOn,
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

export async function findCSVDataSourceByUrlAndOrg(url: string, orgId: string) {
  return await db
    .selectFrom("dataSource")
    .where("organisationId", "=", orgId)
    .where(({ eb, ref }) => {
      return eb(ref("config", "->>").key("type"), "=", DataSourceType.CSV);
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

export async function updateDefaultInspectorConfig(
  id: string,
  config: DefaultInspectorConfig,
) {
  await db
    .updateTable("dataSource")
    .set({ defaultInspectorConfig: config })
    .where("id", "=", id)
    .execute();
}

export async function updateDefaultChoroplethConfig(
  id: string,
  config: DefaultChoroplethConfig | null,
) {
  await db
    .updateTable("dataSource")
    .set({ defaultChoroplethConfig: config })
    .where("id", "=", id)
    .execute();
}

export async function updateColumnDefsWithEnrichment(
  dataSourceId: string,
  enrichedColumnDefs: ColumnDef[],
) {
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) return;

  const existingNames = new Set(
    (dataSource.columnDefs ?? []).map((c) => c.name),
  );
  const newDefs = enrichedColumnDefs.filter(
    (def) => !existingNames.has(def.name),
  );
  if (newDefs.length === 0) return;

  const updatedColumnDefs = [...(dataSource.columnDefs ?? []), ...newDefs];
  await db
    .updateTable("dataSource")
    .set({ columnDefs: updatedColumnDefs })
    .where("id", "=", dataSourceId)
    .execute();
}

export async function getUniqueColumnValues(id: string, column: string) {
  const result = await sql<{ value: string }>`
    SELECT DISTINCT json->>${column} AS "value"
    FROM data_record
    WHERE data_source_id = ${id}
    AND json->>${column} IS NOT NULL
    LIMIT 51
  `.execute(db);
  const values = result.rows.map((row) => row.value);
  // Don't let users configure value labels when there are too many unique values
  if (values.length > 50) {
    return null;
  }
  return values;
}
