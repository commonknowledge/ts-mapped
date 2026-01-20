import { sql } from "kysely";
import { MAX_COLUMN_KEY } from "@/constants";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { ColumnType } from "../models/DataSource";
import { CalculationType } from "../models/MapView";
import type { AreaStat, BoundingBox } from "../models/Area";
import type { AreaSetCode } from "../models/AreaSet";
import type { DataSource } from "../models/DataSource";
import type { Database } from "@/server/services/database";
import type { CaseBuilder, CaseWhenBuilder } from "kysely";

interface AreaStats {
  areaSetCode: AreaSetCode;
  calculationType: CalculationType;
  dataSourceId: string;

  primary?: {
    column: string;
    columnType: ColumnType;
    maxValue: number;
    minValue: number;
    stats: {
      areaCode: string;
      value?: unknown;
    }[];
  };

  secondary?: {
    column: string;
    columnType: ColumnType;
    maxValue: number;
    minValue: number;
    stats: {
      areaCode: string;
      value?: unknown;
    }[];
  };
}

export const getAreaStats = async ({
  areaSetCode,
  dataSourceId,
  calculationType,
  column,
  secondaryColumn,
  excludeColumns,
  boundingBox = null,
}: {
  areaSetCode: AreaSetCode;
  dataSourceId: string;
  calculationType: CalculationType;
  column: string;
  secondaryColumn?: string;
  excludeColumns: string[];
  boundingBox?: BoundingBox | null;
}): Promise<AreaStats> => {
  const areaStats: AreaStats = {
    areaSetCode,
    calculationType,
    dataSourceId,
  };

  if (column === MAX_COLUMN_KEY) {
    const stats = await getMaxColumnByArea(
      areaSetCode,
      dataSourceId,
      excludeColumns,
      boundingBox,
    );
    const { maxValue, minValue } = getValueRange(stats);
    areaStats.primary = {
      column,
      columnType: ColumnType.String,
      maxValue,
      minValue,
      stats,
    };
    return areaStats;
  }

  if (calculationType === CalculationType.Count) {
    const stats = await getRecordCountByArea(
      areaSetCode,
      dataSourceId,
      boundingBox,
    );
    const { maxValue } = getValueRange(stats);
    areaStats.primary = {
      column,
      columnType: ColumnType.Number,
      minValue: 0, // Force count min to be 0 (areas with no records have count = 0 implicitly)
      maxValue,
      stats,
    };
    return areaStats;
  }

  try {
    const dataSource = await findDataSourceById(dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source not found: ${dataSourceId}`);
    }

    const primaryStats = await getColumnValueByArea(
      dataSource,
      areaSetCode,
      calculationType,
      column,
      boundingBox,
    );
    
    // Check if we have any stats
    if (!primaryStats.stats || primaryStats.stats.length === 0) {
      throw new Error(`No data found for column "${column}". Make sure the data is geocoded to areas and contains values.`);
    }
    
    const valueRange = getValueRange(primaryStats.stats);
    
    // Check if we have valid numeric values
    if (valueRange.minValue === null || valueRange.maxValue === null) {
      throw new Error(`No valid numeric values found for column "${column}". The column may contain non-numeric data.`);
    }
    
    areaStats.primary = {
      ...primaryStats,
      ...valueRange,
    };

    if (!secondaryColumn) {
      return areaStats;
    }

    const secondaryStats = await getColumnValueByArea(
      dataSource,
      areaSetCode,
      calculationType,
      secondaryColumn,
      boundingBox,
    );
    const secondaryValueRange = getValueRange(secondaryStats.stats);
    areaStats.secondary = {
      ...secondaryStats,
      ...secondaryValueRange,
    };
    return areaStats;
  } catch (error) {
    logger.error(`Failed to get area stats`, { error });
    // Re-throw the error so it's properly handled by tRPC
    throw error;
  }
};

export const getMaxColumnByArea = async (
  areaSetCode: string,
  dataSourceId: string,
  excludeColumns: string[],
  boundingBox: BoundingBox | null = null,
) => {
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) return [];

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
        geocode_result->'areas'->>${areaSetCode} as area_code,
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
    return filterResult(result.rows, ColumnType.String);
  } catch (error) {
    logger.error(`Failed to get area max column by area`, { error });
  }
  return [];
};

const getColumnValueByArea = async (
  dataSource: DataSource,
  areaSetCode: AreaSetCode,
  calculationType: CalculationType,
  column: string,
  boundingBox: BoundingBox | null,
) => {
  const columnDef = dataSource.columnDefs.find((c) => c.name === column);
  if (!columnDef) {
    throw new Error(`Data source column not found: ${column}`);
  }

  // Select is always MODE for ColumnType !== Number
  // For numeric columns, cast to float - treat empty strings as 0 for numeric columns
  const valueSelect =
    columnDef.type !== ColumnType.Number
      ? sql`MODE () WITHIN GROUP (ORDER BY json->>${column})`.as("value")
      : db.fn(calculationType, [
          sql`COALESCE(NULLIF(json->>${column}, '')::float, 0)`
        ]).as("value");

  const query = db
    .selectFrom("dataRecord")
    .select([
      sql`geocode_result->'areas'->>${areaSetCode}`.as("areaCode"),
      valueSelect,
    ])
    .where("dataRecord.dataSourceId", "=", dataSource.id)
    .where(getBoundingBoxSQL(boundingBox))
    .groupBy("areaCode");

  const result = await query.execute();
  const stats = filterResult(result, columnDef.type);
  return { column, columnType: columnDef.type, stats };
};

export const getRecordCountByArea = async (
  areaSetCode: string,
  dataSourceId: string,
  boundingBox: BoundingBox | null = null,
) => {
  try {
    const query = db
      .selectFrom("dataRecord")
      .select([
        sql`geocode_result->'areas'->>${areaSetCode}`.as("areaCode"),
        ({ fn }) => fn.countAll().as("value"),
      ])
      .where("dataRecord.dataSourceId", "=", dataSourceId)
      .where(getBoundingBoxSQL(boundingBox))
      .groupBy("areaCode");

    const result = await query.execute();

    // Ensure the counts are numbers, not strings (returned by Postgres)
    const stats = filterResult(result, ColumnType.Number);

    return stats;
  } catch (error) {
    logger.error(`Failed to get area max column by area`, { error });
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
        geocode_point
      )
    `;
};

const filterResult = (result: unknown[], columnType: ColumnType) => {
  const filtered: AreaStat[] = [];
  for (const r of result) {
    if (
      r &&
      typeof r === "object" &&
      "areaCode" in r &&
      typeof r.areaCode === "string" &&
      "value" in r &&
      r.value !== null &&
      r.value !== undefined
    ) {
      if (columnType === ColumnType.Number) {
        const numValue = Number(r.value);
        // Only include valid numbers (not NaN, and allow 0 as a valid value)
        if (!isNaN(numValue)) {
          filtered.push({ ...r, value: numValue } as AreaStat);
        }
      } else {
        filtered.push(r as AreaStat);
      }
    }
  }
  return filtered;
};

const getValueRange = (stats: { areaCode: string; value?: unknown }[]) => {
  let minValue = null;
  let maxValue = null;

  const values = stats.map((s) => s.value).filter((s) => typeof s === "number" && !isNaN(s));
  
  if (values.length === 0) {
    // If no valid numeric values, return null to indicate no data
    return { minValue: null, maxValue: null };
  }
  
  for (const v of values) {
    if (minValue === null || v < minValue) {
      minValue = v;
    }
    if (maxValue === null || v > maxValue) {
      maxValue = v;
    }
  }

  // Ensure we have valid numbers (not null)
  return { 
    minValue: minValue ?? 0, 
    maxValue: maxValue ?? 0 
  };
};
