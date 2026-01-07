import { DATA_SOURCE_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { geocodeRecord } from "@/server/mapping/geocode";
import { ColumnType } from "@/server/models/DataSource";
import {
  deleteByDataSourceId,
  upsertDataRecord,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { getPubSub } from "@/server/services/pubsub";
import { batchAsync } from "@/server/utils";
import type { ColumnDef } from "@/server/models/DataSource";
import type { DataSource } from "@/server/models/DataSource";
import type { ExternalRecord } from "@/types";

const importDataSource = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);

  logger.info(`Importing data source ${dataSourceId}`);

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  await deleteByDataSourceId(dataSource.id);

  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return false;
  }

  const pubsub = getPubSub();

  try {
    pubsub.publish("dataSourceEvent", {
      dataSourceId: dataSource.id,
      event: "ImportStarted",
      at: new Date(),
    });

    let count = 0;
    const columnDefsAccumulator: ColumnDef[] = [];
    const total = await adaptor.getRecordCount();
    const records = adaptor.fetchAll();
    const batches = batchAsync(records, DATA_SOURCE_JOB_BATCH_SIZE);

    for await (const batch of batches) {
      await importBatch(batch, dataSource, columnDefsAccumulator);
      count += batch.length;
      if (total) {
        const percentComplete = Math.floor((count * 100) / total);
        logger.info(
          `Inserted ${count} records of ${total}, ${percentComplete}% complete`,
        );
      } else {
        logger.info(`Inserted ${count} records`);
      }
      pubsub.publish("dataSourceEvent", {
        dataSourceId: dataSource.id,
        event: "RecordsImported",
        at: new Date(),
        count,
      });
    }

    await updateDataSource(dataSource.id, {
      columnDefs: columnDefsAccumulator,
    });

    pubsub.publish("dataSourceEvent", {
      dataSourceId: dataSource.id,
      event: "ImportComplete",
      at: new Date(),
    });

    logger.info(`Imported data source ${dataSource.id}: ${dataSource.name}`);
    return true;
  } catch (error) {
    pubsub.publish("dataSourceEvent", {
      dataSourceId: dataSource.id,
      event: "ImportFailed",
      at: new Date(),
    });

    logger.error(
      `Failed to import records for ${dataSource.config.type} ${dataSourceId}`,
      { error },
    );
  }

  return false;
};

export const importBatch = (
  batch: ExternalRecord[],
  dataSource: DataSource,
  columnDefsAccumulator: ColumnDef[],
) =>
  Promise.all(
    batch.map(async (record) => {
      const { columnDefs, typedJson } = typeJson(record.json);
      addColumnDefs(columnDefsAccumulator, columnDefs);
      const geocodeResult = await geocodeRecord(
        record,
        dataSource.geocodingConfig,
      );
      await upsertDataRecord({
        externalId: record.externalId,
        json: typedJson,
        geocodeResult: geocodeResult,
        geocodePoint: geocodeResult?.centralPoint,
        dataSourceId: dataSource.id,
      });
      logger.info(`Inserted data record ${record.externalId}`);
    }),
  );

export const typeJson = (
  json: Record<string, unknown>,
): { columnDefs: ColumnDef[]; typedJson: Record<string, unknown> } => {
  const columnDefs: ColumnDef[] = [];
  const typedJson: Record<string, unknown> = {};
  for (const key of Object.keys(json)) {
    const value = json[key];
    const columnType = getType(value);
    let typedValue = value;
    if (columnType === ColumnType.Object) {
      typedValue = typeJson(value as Record<string, unknown>).typedJson;
    } else if (columnType === ColumnType.Number) {
      typedValue = parseNumber(value);
    } else if (columnType === ColumnType.Empty) {
      typedValue = "";
    }
    columnDefs.push({ name: key, type: columnType });
    typedJson[key] = typedValue;
  }
  return { columnDefs, typedJson };
};

const getType = (value: unknown): ColumnType => {
  /**
   * Rules:
   *
   * 1. Basic types
   * undefined, null  => "empty"
   * boolean          => "boolean"
   * number, bigint   => "number"
   * object           => "object"
   *
   * 2. String parsing
   * numeric           => "number"
   * else              => "string"
   *
   * 3. Default to "unknown"
   */
  if (typeof value === "undefined") {
    return ColumnType.Empty;
  }

  if (typeof value === "boolean") {
    return ColumnType.Boolean;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return ColumnType.Number;
  }

  if (typeof value === "object") {
    return value ? ColumnType.Object : ColumnType.Empty;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim().replace(/%$/, "");
    if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(trimmedValue)) {
      return ColumnType.Number;
    }
    if (!trimmedValue || trimmedValue === "-") {
      return ColumnType.Empty;
    }
    return ColumnType.String;
  }

  return ColumnType.String;
};

/**
 * Parse numbers according to the typing logic above:
 * - Remove percent signs
 */
const parseNumber = (value: unknown): number => {
  if (typeof value !== "string") {
    return Number(value);
  }
  return Number(value.replace(/%$/, ""));
};

const addColumnDefs = (
  columnDefsAccumulator: ColumnDef[],
  recordColumnDefs: ColumnDef[],
): void => {
  const recordColumnNames = recordColumnDefs.map((c) => c.name);

  for (const name of recordColumnNames) {
    const accColumn = columnDefsAccumulator.find((c) => c.name === name);
    const recColumn = recordColumnDefs.find((c) => c.name === name);

    const mergedType = mergeColumnType(accColumn?.type, recColumn?.type);
    if (accColumn) {
      accColumn.type = mergedType;
    } else {
      columnDefsAccumulator.push({ name, type: mergedType });
    }
  }
};

const mergeColumnType = (
  a: ColumnType | undefined,
  b: ColumnType | undefined,
): ColumnType => {
  // undefined => "empty"
  a = a || ColumnType.Empty;
  b = b || ColumnType.Empty;

  // identical types => known type
  if (a === b) {
    return a;
  }

  // a or b empty => use the other type
  if (a !== ColumnType.Empty && b === ColumnType.Empty) {
    return a;
  }
  if (a === ColumnType.Empty && b !== ColumnType.Empty) {
    return b;
  }

  // different types, not empty => "unknown"
  return ColumnType.Unknown;
};

export default importDataSource;
