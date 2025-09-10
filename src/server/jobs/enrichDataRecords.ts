import { getDataSourceAdaptor } from "@/server/adaptors";
import { findDataSourceById } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { enrichBatch } from "./enrichDataSource";

const enrichDataRecords = async (args: object | null): Promise<boolean> => {
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
    `Enriching ${args.externalRecordIds.length} records for data source ${dataSourceId}`
  );

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`
    );
    return false;
  }

  try {
    const records = await adaptor.fetchByExternalId(
      args.externalRecordIds as string[]
    );

    const enrichedRecords = await enrichBatch(records, dataSource);
    await adaptor.updateRecords(enrichedRecords);

    logger.info(
      `Enriched ${records.length} data source records for ${dataSource.id}: ${dataSource.name}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to enrich records for ${dataSource.config.type} ${dataSourceId}`,
      { error }
    );
  }

  return false;
};

export default enrichDataRecords;
