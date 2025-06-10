import { NewDataRecord } from "@/server/models/DataRecord";
import { db } from "@/server/services/database";

export async function countDataRecordsForDataSource(
  dataSourceId: string,
): Promise<number> {
  const result = await db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .select(({ fn }) => [fn.countAll().as("count")])
    .executeTakeFirst();
  return Number(result?.count) || 0;
}

export function getFirstDataRecord(dataSourceId: string) {
  return db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
}

export function streamDataRecordsByDataSource(dataSourceId: string) {
  return db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .selectAll()
    .stream();
}

export async function findDataRecordByDataSourceAndAreaCode(
  dataSourceId: string,
  areaSetCode: string,
  areaCode: string,
) {
  return db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .where(({ eb, ref }) => {
      return eb(
        ref("geocodeResult", "->>").key("areas").key(areaSetCode),
        "=",
        areaCode,
      );
    })
    .selectAll()
    .executeTakeFirst();
}

export function upsertDataRecord(dataRecord: NewDataRecord) {
  return db
    .insertInto("dataRecord")
    .values(dataRecord)
    .onConflict((oc) =>
      oc.columns(["externalId", "dataSourceId"]).doUpdateSet({
        json: dataRecord.json,
        geocodeResult: dataRecord.geocodeResult,
        geocodePoint: dataRecord.geocodePoint,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
