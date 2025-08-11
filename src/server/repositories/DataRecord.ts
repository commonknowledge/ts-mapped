import { AliasableExpression, ExpressionBuilder, SqlBool, sql } from "kysely";
import {
  FilterOperator,
  FilterType,
  RecordFilterInput,
  SortInput,
} from "@/__generated__/types";
import { DATA_RECORDS_PAGE_SIZE, MARKER_MATCHED_COLUMN } from "@/constants";
import { NewDataRecord } from "@/server/models/DataRecord";
import { Database, db } from "@/server/services/database";

export async function countDataRecordsForDataSource(
  dataSourceId: string,
  filter: RecordFilterInput | null | undefined,
  search: string | null | undefined,
): Promise<{ count: number; matched: number }> {
  const result = await db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .select(({ eb, fn }) => [
      fn.countAll().as("count"),
      fn
        .count(
          eb
            .case()
            .when(applyFilterAndSearch(eb, filter, search))
            .then(1)
            .else(null)
            .end(),
        )
        .as("matched"),
    ])
    .executeTakeFirst();
  return {
    count: Number(result?.count) || 0,
    matched: Number(result?.matched) || 0,
  };
}

export function getFirstDataRecord(dataSourceId: string) {
  return db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
}

function applyFilterAndSearch(
  eb: ExpressionBuilder<Database, "dataRecord">,
  filter: RecordFilterInput | null | undefined,
  search: string | null | undefined,
) {
  const applyFilter = (
    filter: RecordFilterInput | null | undefined,
  ): AliasableExpression<SqlBool> => {
    if (filter?.type === FilterType.MULTI && filter.children?.length) {
      if (filter.operator === FilterOperator.OR) {
        return eb.or(filter.children.map((c) => applyFilter(c)));
      } else {
        return eb.and(filter.children.map((c) => applyFilter(c)));
      }
    }

    if (filter?.type === FilterType.GEO) {
      if (filter.placedMarker) {
        const metres = (filter.distance || 0) * 1000;
        return sql<boolean>`
          ST_DWithin(geocode_point, (SELECT point FROM placed_marker WHERE id = ${filter.placedMarker}), ${metres})
        `;
      }
      if (filter.turf) {
        return sql<boolean>`ST_Intersects(geocode_point, (SELECT polygon FROM turf WHERE id = ${filter.turf}))`;
      }
      if (filter.dataRecordId) {
        const metres = (filter.distance || 0) * 1000;
        return sql<boolean>`
          ST_DWithin(geocode_point, (SELECT geocode_point FROM data_record WHERE id = ${filter.dataRecordId}), ${metres})
        `;
      }
    }

    if (filter?.type === FilterType.TEXT) {
      return eb(
        eb.fn("lower", [eb.ref("json", "->>").key(filter?.column || "")]),
        "=",
        filter?.search?.toLowerCase() || "",
      );
    }

    // Trivially always true fallthrough expression for reliability
    // (e.g. in the case of a broken filter, return everything rather than nothing)
    return eb(eb.val(1), "=", 1);
  };

  if (!search) {
    return applyFilter(filter);
  }

  const words = search
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean);

  return eb.and([
    applyFilter(filter),
    ...words.map((w) => sql<boolean>`json_text_search ILIKE ${"%" + w + "%"}`),
  ]);
}

export function findDataRecordsByDataSource(
  dataSourceId: string,
  filter: RecordFilterInput | null | undefined,
  search: string | null | undefined,
  page: number,
  sort: SortInput[],
) {
  let q = db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .where((eb) => applyFilterAndSearch(eb, filter, search))
    .offset(page * DATA_RECORDS_PAGE_SIZE)
    .limit(DATA_RECORDS_PAGE_SIZE)
    .selectAll();

  if (sort.length) {
    for (const s of sort) {
      q = q.orderBy(
        ({ ref }) => {
          return ref("json", "->>").key(s.name);
        },
        s.desc ? "desc" : "asc",
      );
    }
  } else {
    q = q.orderBy("id asc");
  }

  return q.execute();
}

export function streamDataRecordsByDataSource(
  dataSourceId: string,
  filter: RecordFilterInput | null,
  search: string,
) {
  return db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .selectAll()
    .select([
      (eb) =>
        applyFilterAndSearch(eb, filter, search).as(MARKER_MATCHED_COLUMN),
    ])
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
