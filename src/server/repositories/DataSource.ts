import { DataSourceUpdate, NewDataSource } from "@/server/models/DataSource";
import { db } from "@/server/services/database";

export async function findDataSourceById(id: string) {
  return await db
    .selectFrom("dataSource")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export async function listDataSources() {
  return db.selectFrom("dataSource").selectAll().execute();
}

export async function updateDataSource(id: string, updateWith: DataSourceUpdate) {
  await db
    .updateTable("dataSource")
    .set(updateWith)
    .where("id", "=", id)
    .execute();
}

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
