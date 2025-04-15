import {
  CaseBuilder,
  CaseWhenBuilder,
  ExpressionBuilder,
  SelectQueryBuilder,
} from "kysely";
import {
  AreaStat,
  BoundingBoxInput,
  ColumnType,
  Operation,
} from "@/__generated__/types";
import { MAX_COLUMN_KEY } from "@/constants";
import { Database } from "@/server/models";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";

export const getAreaStats = async (
  areaSetCode: string,
  dataSourceId: string,
  column: string,
  operation: Operation,
  excludeColumns: string[],
  boundingBox: BoundingBoxInput | null = null,
): Promise<{ column: string; columnType: ColumnType; stats: AreaStat[] }> => {
  if (column === MAX_COLUMN_KEY) {
    const stats = await getMaxColumnByArea(
      areaSetCode,
      dataSourceId,
      excludeColumns,
      boundingBox,
    );
    return { column, columnType: ColumnType.String, stats };
  }

  let query = db
    .selectFrom("dataRecord")
    .select(({ cast, fn, ref }) => [
      ref("geocodeResult", "->>").key("areas").key(areaSetCode).as("areaCode"),
      fn(operation, [
        cast(ref("json", "->>").key(column), "double precision"),
      ]).as("value"),
    ])
    .where("dataRecord.dataSourceId", "=", dataSourceId)
    .groupBy("areaCode");

  if (boundingBox) {
    query = addBoundingBoxFilter(query, boundingBox);
  }

  try {
    const result = await query.execute();
    const stats = filterResult(result);
    return { column, columnType: ColumnType.Number, stats };
  } catch (error) {
    logger.error(`Failed to get area stats`, { error });
  }
  return { column, columnType: ColumnType.Unknown, stats: [] };
};

export const getMaxColumnByArea = async (
  areaSetCode: string,
  dataSourceId: string,
  excludeColumns: string[],
  boundingBox: BoundingBoxInput | null = null,
) => {
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    return [];
  }
  const columnNames = dataSource.columnDefs
    .filter(
      ({ name, type }) =>
        !excludeColumns.includes(name) && type === ColumnType.Number,
    )
    .map((c) => c.name);

  // Skip query if there are no valid columns
  if (!columnNames.length) {
    return [];
  }

  // First annotate the data_record table with two columns:
  //   1. max_column, which stores the name of the column with the highest value.
  //   2. area_code, which is the code of the geocoded area for the record,
  //      for the provided area set.
  //
  // Then group by area_code and max_column, counting the number of
  // records in each group. Order by area_code, count DESC so that
  // the group with the highest count for each area comes first.
  //
  // Finally, SELECT DISTINCT ON ("area_code") to return only this first row
  // for each area.
  const query = db
    .with("dataRecordWithMaxColumn", (db) => {
      const withQuery = db
        .selectFrom("dataRecord")
        .where("dataSourceId", "=", dataSourceId)
        .select(({ eb, ref }) => [
          ref("geocodeResult", "->>")
            .key("areas")
            .key(areaSetCode)
            .as("areaCode"),
          createMaxColumnExpression(eb, columnNames),
        ]);
      if (!boundingBox) {
        return withQuery;
      }
      return addBoundingBoxFilter(withQuery, boundingBox);
    })
    .with("maxColumnCountsByArea", (db) => {
      return db
        .selectFrom("dataRecordWithMaxColumn")
        .select(({ fn }) => [
          "areaCode",
          "maxColumn",
          fn.countAll().as("count"),
        ])
        .groupBy(["areaCode", "maxColumn"])
        .orderBy(["areaCode", "count desc"]);
    })
    .selectFrom("maxColumnCountsByArea")
    .distinctOn("areaCode")
    .select(["areaCode", "maxColumn as value"]);

  try {
    const result = await query.execute();
    return filterResult(result);
  } catch (error) {
    logger.error(`Failed to get area max column by area`, { error });
  }
  return [];
};

const addBoundingBoxFilter = <C>(
  query: SelectQueryBuilder<Database, "dataRecord", C>,
  boundingBox: BoundingBoxInput,
) => {
  // ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)
  return query.where(({ cast, fn, ref, val }) => {
    return fn<boolean>("ST_Intersects", [
      fn("ST_MakeEnvelope", [
        val(boundingBox.west),
        val(boundingBox.south),
        val(boundingBox.east),
        val(boundingBox.north),
        val(4326),
      ]),
      fn("ST_SetSRID", [
        fn("ST_MakePoint", [
          cast(
            ref("geocodeResult", "->>").key("centralPoint").key("lng"),
            "double precision",
          ),
          cast(
            ref("geocodeResult", "->>").key("centralPoint").key("lat"),
            "double precision",
          ),
        ]),
        val(4326),
      ]),
    ]);
  });
};

const createMaxColumnExpression = (
  eb: ExpressionBuilder<Database, "dataRecord">,
  columnNames: string[],
) => {
  if (columnNames.length === 0) {
    return eb.val(null).as("maxColumn");
  }

  const firstColumn = columnNames[0];
  const otherColumns = columnNames.slice(1);

  const addGreatestCase = (
    caseBuilder:
      | CaseBuilder<Database, keyof Database, unknown, never>
      | CaseWhenBuilder<Database, keyof Database, unknown, string>,
    column: string,
  ) => {
    return caseBuilder
      .when(
        eb.fn(
          "GREATEST",
          columnNames.map((c) => eb.ref("json", "->>").key(c)),
        ),
        "=",
        eb.ref("json", "->>").key(column),
      )
      .then(column);
  };

  // Create the case statement with the first column to ensure
  // at least one statement is present.
  let maxColumnCaseStatements = addGreatestCase(db.case(), firstColumn);
  otherColumns.forEach((c) => {
    maxColumnCaseStatements = addGreatestCase(maxColumnCaseStatements, c);
  });
  return maxColumnCaseStatements.end().as("maxColumn");
};

const filterResult = (result: { areaCode: unknown; value: unknown }[]) =>
  result.filter(
    (r) =>
      r &&
      typeof r === "object" &&
      "areaCode" in r &&
      "value" in r &&
      r.areaCode !== null &&
      r.value !== null,
  ) as AreaStat[];
