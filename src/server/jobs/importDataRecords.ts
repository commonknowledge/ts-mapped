import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { batchAsync } from "../utils";
import { importBatch } from "./importDataSource";

const importDataRecords = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);

  const dataRecords = db
    .selectFrom("dataRecord")
    .select(["id", "externalId"])
    .where("dataSourceId", "=", dataSourceId)
    .where("needsImport", "=", true)
    .stream();

  const recordCount = await db
    .selectFrom("dataRecord")
    .select(({ fn }) => fn.countAll().as("count"))
    .where("dataSourceId", "=", dataSourceId)
    .where("needsImport", "=", true)
    .executeTakeFirst();

  logger.info(
    `Importing ${recordCount?.count} records for data source ${dataSourceId}`,
  );

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return false;
  }

  const batches = batchAsync(dataRecords, DATA_RECORDS_JOB_BATCH_SIZE);
  const columnDefsAccumulator = [...dataSource.columnDefs];

  for await (const batch of batches) {
    try {
      const records = await adaptor.fetchByExternalId(
        batch.map((r) => r.externalId),
      );

      await importBatch(records, dataSource, columnDefsAccumulator);

      await db
        .updateTable("dataRecord")
        .set({ needsImport: false })
        .where(
          "id",
          "in",
          batch.map((r) => r.id),
        )
        .where("dataSourceId", "=", dataSourceId)
        .execute();

      logger.info(
        `Imported ${records.length} data source records for ${dataSource.id}: ${dataSource.name}`,
      );
    } catch (error) {
      logger.error(
        `Failed to import records for ${dataSource.config.type} ${dataSourceId}`,
        { error },
      );
      return false;
    }
  }

  await updateDataSource(dataSource.id, {
    columnDefs: columnDefsAccumulator,
  });

  // Update the recordCount for the data source
  const totalRecordCount = await db
    .selectFrom("dataRecord")
    .select(({ fn }) => fn.countAll().as("count"))
    .where("dataSourceId", "=", dataSourceId)
    .executeTakeFirst();

  await updateDataSource(dataSourceId, {
    recordCount: Number(totalRecordCount?.count ?? 0),
  });

  return true;
};

export default importDataRecords;
