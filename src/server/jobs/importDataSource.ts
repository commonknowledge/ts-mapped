import { ColumnDef, ColumnType } from "@/__generated__/types";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { mapRecord } from "@/server/mapping";
import { DataSource } from "@/server/models/DataSource";
import { upsertDataRecord } from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import pubSub from "@/server/services/pubsub";

const BATCH_SIZE = 100;

const importDataSource = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  const adaptor = getDataSourceAdaptor(dataSource.config);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return false;
  }

  try {
    let count = 0;
    const columnDefsAccumulator: ColumnDef[] = [];
    const total = await adaptor.getRecordCount();
    const records = adaptor.fetchAll();
    const batches = batch(records, BATCH_SIZE);

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
      pubSub.publish("dataSourceEvent", {
        dataSourceEvent: {
          dataSourceId: dataSource.id,
          recordsImported: {
            at: new Date().toISOString(),
            count,
          },
        },
      });
    }

    await updateDataSource(dataSource.id, {
      columnDefs: JSON.stringify(columnDefsAccumulator),
    });

    pubSub.publish("dataSourceEvent", {
      dataSourceEvent: {
        dataSourceId: dataSource.id,
        importComplete: {
          at: new Date().toISOString(),
        },
      },
    });

    logger.info(`Imported data source ${dataSource.id}: ${dataSource.name}`);
    return true;
  } catch (e) {
    pubSub.publish("dataSourceEvent", {
      dataSourceEvent: {
        dataSourceId: dataSource.id,
        importFailed: {
          at: new Date().toISOString(),
        },
      },
    });

    logger.error(
      `Failed to import records for ${dataSource.config.type} ${dataSourceId}: ${e}`,
    );
  }

  return false;
};

const batch = async function* (
  records: AsyncGenerator<
    { externalId: string; json: Record<string, unknown> },
    unknown,
    unknown
  >,
  batchSize: number,
) {
  let batch = [];
  for await (const record of records) {
    batch.push(record);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) {
    yield batch;
  }
};

const importBatch = (
  batch: { externalId: string; json: Record<string, unknown> }[],
  dataSource: DataSource,
  columnDefsAccumulator: ColumnDef[],
) =>
  Promise.all(
    batch.map(async (record) => {
      const { columnDefs, typedJson } = typeJson(record.json);
      addColumnDefs(columnDefsAccumulator, columnDefs);
      const mappedJson = await mapRecord(record, dataSource.geocodingConfig);
      await upsertDataRecord({
        externalId: record.externalId,
        json: JSON.stringify(typedJson),
        mappedJson: JSON.stringify(mappedJson),
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
      typedValue = Number(value);
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
    const trimmedValue = value.trim();
    if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(trimmedValue)) {
      return ColumnType.Number;
    }
    return ColumnType.String;
  }

  return ColumnType.String;
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
