import { sql } from "kysely";
import { FilterOperator, FilterType } from "@/__generated__/types";
import {
  DATA_RECORDS_PAGE_SIZE,
  MARKER_MATCHED_COLUMN,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
} from "@/constants";
import { db } from "@/server/services/database";
import type { Point } from "../models/shared";
import type { RecordFilterInput, SortInput } from "@/__generated__/types";
import type { NewDataRecord } from "@/server/models/DataRecord";
import type { Database } from "@/server/services/database";
import type {
  AliasableExpression,
  ExpressionBuilder,
  SelectQueryBuilder,
  SqlBool,
} from "kysely";

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
      if (filter.operator === FilterOperator.AND) {
        return eb.and(filter.children.map((c) => applyFilter(c)));
      } else {
        return eb.or(filter.children.map((c) => applyFilter(c)));
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

export async function findDataRecordsByDataSource(
  dataSourceId: string,
  filter: RecordFilterInput | null | undefined,
  search: string | null | undefined,
  page: number,
  sort: SortInput[],
  all: boolean | null | undefined,
) {
  let q = db
    .selectFrom("dataRecord")
    .where("dataSourceId", "=", dataSourceId)
    .where((eb) => applyFilterAndSearch(eb, filter, search))
    .selectAll();

  if (!all) {
    q = q.limit(DATA_RECORDS_PAGE_SIZE).offset(page * DATA_RECORDS_PAGE_SIZE);
  }

  // Async work required for sorting has to be done here, as applySort()
  // cannot return a query builder and be async (Kysely throws an error
  // when awaiting an un-executed expression.)
  let nameColumns: string[] = [];
  const hasSortByName = sort.some((s) => s.name === SORT_BY_NAME_COLUMNS);
  if (hasSortByName) {
    const dataSource = await db
      .selectFrom("dataSource")
      .where("id", "=", dataSourceId)
      .select("columnRoles")
      .executeTakeFirstOrThrow();
    nameColumns = dataSource.columnRoles.nameColumns || [];
  }

  for (const s of sort) {
    q = applySort(q, s, nameColumns);
  }

  // Default sort by ID
  q = q.orderBy("id asc");

  return q.execute();
}

function applySort<T>(
  q: SelectQueryBuilder<Database, "dataRecord", T>,
  sort: SortInput,
  nameColumns: string[],
) {
  const order = sort.desc ? "desc" : "asc";

  if (sort.name === SORT_BY_NAME_COLUMNS) {
    for (const c of nameColumns) {
      q = q.orderBy(({ ref }) => ref("json", "->>").key(c), order);
    }
    return q;
  }

  if (sort.name === SORT_BY_LOCATION) {
    if (!sort.location) {
      return q;
    }
    return q.orderBy(
      (eb) =>
        eb(
          "dataRecord.geocodePoint",
          "<->",
          sql<Point>`ST_SetSRID(ST_MakePoint(${sort.location?.lng}, ${sort.location?.lat}), 4326)`,
        ),
      order,
    );
  }

  return q.orderBy(({ ref }) => ref("json", "->>").key(sort.name), order);
}

export function streamDataRecordsByDataSource(
  dataSourceId: string,
  filter: RecordFilterInput | null | undefined,
  search: string | undefined,
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
