import { sql } from "kysely";
import { SortInput } from "@/__generated__/types";
import { DATA_RECORDS_PAGE_SIZE } from "@/constants";
import { NewDataRecord } from "@/server/models/DataRecord";
import { db } from "@/server/services/database";

export async function countDataRecordsForDataSource(
  dataSourceId: string,
  filter: string | null | undefined,
): Promise<number> {
  const result = await filterDataRecordsByDataSource(dataSourceId, filter)
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

function filterDataRecordsByDataSource(
  dataSourceId: string,
  filter: string | null | undefined,
) {
  let q = db.selectFrom("dataRecord").where("dataSourceId", "=", dataSourceId);

  if (filter) {
    q = q.where(sql<boolean>`json_text_search ILIKE ${"%" + filter + "%"}`);
  }

  return q;
}

export function findDataRecordsByDataSource(
  dataSourceId: string,
  filter: string | null | undefined,
  page: number,
  sort: SortInput[],
) {
  let q = filterDataRecordsByDataSource(dataSourceId, filter)
    .offset(page * DATA_RECORDS_PAGE_SIZE)
    .limit(DATA_RECORDS_PAGE_SIZE)
    .selectAll();

  if (sort.length) {
    for (const s of sort) {
      q = q.orderBy(
        ({ ref }) => {
          return ref("json", "->>").key(s.id);
        },
        s.desc ? "desc" : "asc",
      );
    }
  } else {
    q = q.orderBy("id asc");
  }

  return q.execute();
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
