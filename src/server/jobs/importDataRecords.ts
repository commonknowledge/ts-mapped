import { DATA_RECORDS_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { batch } from "../utils";
import { importBatch } from "./importDataSource";
import type { ColumnDef } from "@/__generated__/types";

const importDataRecords = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);

  const dataRecords = await db
    .selectFrom("dataRecord")
    .select(["id", "externalId"])
    .where("dataSourceId", "=", dataSourceId)
    .where("needsImport", "=", true)
    .execute();

  logger.info(
    `Importing ${dataRecords.length} records for data source ${dataSourceId}`,
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

  const batches = batch(dataRecords, DATA_RECORDS_JOB_BATCH_SIZE);

  for (const batch of batches) {
    try {
      const columnDefsAccumulator = [] as ColumnDef[];
      const records = await adaptor.fetchByExternalId(
        batch.map((r) => r.externalId),
      );

      await importBatch(records, dataSource, columnDefsAccumulator);

      await updateDataSource(dataSource.id, {
        columnDefs: columnDefsAccumulator,
      });

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

  return true;
};

export default importDataRecords;
