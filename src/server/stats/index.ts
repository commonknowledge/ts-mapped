import { CaseBuilder, CaseWhenBuilder, sql } from "kysely";
import { AreaStat, ColumnType, Operation } from "@/__generated__/types";
import { MAX_COLUMN_KEY } from "@/constants";
import { Database } from "@/server/models";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { AreaSetCode, BoundingBox } from "@/types";

export const getAreaStats = async (
  areaSetCode: string,
  dataSourceId: string,
  column: string,
  operation: Operation,
  excludeColumns: string[],
  boundingBox: BoundingBox | null = null,
): Promise<{ column: string; columnType: ColumnType; stats: AreaStat[] }> => {
  // Ensure areaSetCode is valid as it will be used in a raw SQL query
  if (!(areaSetCode in AreaSetCode)) {
    return { column, columnType: ColumnType.Unknown, stats: [] };
  }

  if (column === MAX_COLUMN_KEY) {
    const stats = await getMaxColumnByArea(
      areaSetCode,
      dataSourceId,
      excludeColumns,
      boundingBox,
    );
    return { column, columnType: ColumnType.String, stats };
  }

  const query = db
    .selectFrom("dataRecord")
    .select([
      sql`mapped_json->'geocodeResult'->'areas'->>${areaSetCode}`.as(
        "areaCode",
      ),
      db.fn(operation, [sql`(json->>${column})::float`]).as("value"),
    ])
    .where("dataRecord.dataSourceId", "=", dataSourceId)
    .where(getBoundingBoxSQL(boundingBox))
    .groupBy("areaCode");

  try {
    const result = await query.execute();
    const stats = filterResult(result);
    return { column, columnType: ColumnType.Number, stats };
  } catch (e) {
    logger.error(`Failed to get area stats: ${e}`);
  }
  return { column, columnType: ColumnType.Unknown, stats: [] };
};

export const getMaxColumnByArea = async (
  areaSetCode: string,
  dataSourceId: string,
  excludeColumns: string[],
  boundingBox: BoundingBox | null = null,
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

  if (!columnNames.length) {
    return [];
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
        db.fn(
          "GREATEST",
          columnNames.map((c) => sql`json->>${c}`),
        ),
        "=",
        sql`json->>${column}`,
      )
      .then(column);
  };

  // Create the case statement with the first column to ensure
  // at least one statement is present.
  let caseWhen = addGreatestCase(db.case(), firstColumn);
  otherColumns.forEach((c) => {
    caseWhen = addGreatestCase(caseWhen, c);
  });

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
  const q = sql`
    WITH data_record_with_max_column AS (
      SELECT 
        mapped_json->'geocodeResult'->'areas'->>${areaSetCode} as area_code,
        ${caseWhen.end()} AS max_column
      FROM data_record
      WHERE data_source_id = ${dataSourceId}
        AND ${getBoundingBoxSQL(boundingBox)}
    )
    SELECT DISTINCT ON (area_code) 
      area_code as "areaCode",
      max_column as value
    FROM (
      SELECT area_code, max_column, COUNT(*) AS count
      FROM data_record_with_max_column
      GROUP BY area_code, max_column
      ORDER BY area_code, count DESC
    ) subquery;
  `;
  try {
    const result = await q.execute(db);
    return filterResult(result.rows);
  } catch (e) {
    logger.error(`Failed to get area max column by area: ${e}`);
  }
  return [];
};

const getBoundingBoxSQL = (boundingBox: BoundingBox | null) => {
  // Returning a dummy WHERE statement if boundingBox is null makes for cleaner queries above
  if (!boundingBox) {
    return sql<boolean>`1 = 1`;
  }
  // ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)
  return sql<boolean>`
      ST_Intersects(
        ST_MakeEnvelope(
          ${boundingBox.west},
          ${boundingBox.south},
          ${boundingBox.east},
          ${boundingBox.north},
          4326
        ),
        ST_SetSRID(
          ST_MakePoint(
            (mapped_json->'geocodeResult'->'centralPoint'->>'lng')::float,
            (mapped_json->'geocodeResult'->'centralPoint'->>'lat')::float
          ),
          4326
        )
      )
    `;
};

const filterResult = (result: unknown[]) =>
  result.filter(
    (r) =>
      r &&
      typeof r === "object" &&
      "areaCode" in r &&
      "value" in r &&
      r.areaCode !== null &&
      r.value !== null,
  ) as AreaStat[];
