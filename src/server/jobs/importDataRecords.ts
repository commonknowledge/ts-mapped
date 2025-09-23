import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { importBatch } from "./importDataSource";
import type { ColumnDef } from "@/__generated__/types";

const importDataRecords = async (args: object | null): Promise<boolean> => {
  if (
    !args ||
    !("dataSourceId" in args) ||
    !("externalRecordIds" in args) ||
    !Array.isArray(args.externalRecordIds)
  ) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);

  logger.info(
    `Importing ${args.externalRecordIds.length} records for data source ${dataSourceId}`,
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

  try {
    const columnDefsAccumulator = [] as ColumnDef[];
    const records = await adaptor.fetchByExternalId(
      args.externalRecordIds as string[],
    );

    await importBatch(records, dataSource, columnDefsAccumulator);

    await updateDataSource(dataSource.id, {
      columnDefs: columnDefsAccumulator,
    });

    logger.info(
      `Imported ${records.length} data source records for ${dataSource.id}: ${dataSource.name}`,
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to import records for ${dataSource.config.type} ${dataSourceId}`,
      { error },
    );
  }

  return false;
};

export default importDataRecords;
