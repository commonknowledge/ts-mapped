import { NewDataRecord } from "@/server/models/DataRecord";
import { db } from "@/server/services/database";

export function getFirstDataRecord(dataSourceId: string) {
  return db
  .selectFrom("dataRecord")
  .where("dataSourceId", "=", dataSourceId)
  .limit(1)
  .selectAll()
  .executeTakeFirst();
}

export function findDataRecordsByDataSource(dataSourceId: string) {
  return db
  .selectFrom("dataRecord")
  .where("dataSourceId", "=", dataSourceId)
  .selectAll()
  .execute()
}

export function upsertDataRecord(dataRecord: NewDataRecord) {
  return db
    .insertInto("dataRecord")
    .values(dataRecord)
    .onConflict((oc) =>
      oc.columns(["externalId", "dataSourceId"]).doUpdateSet({ json: dataRecord.json, mappedJson: dataRecord.mappedJson })
    )
    .returningAll()
    .executeTakeFirstOrThrow()
}
