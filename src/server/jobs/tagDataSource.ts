import { DATA_SOURCE_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  countDataRecordsForDataSource,
  streamDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findMapViewById } from "@/server/repositories/MapView";
import logger from "@/server/services/logger";
import { batchAsync } from "@/server/utils";
import { findMapById } from "../repositories/Map";
import type { TaggedRecord } from "@/types";

const tagDataSource = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args) || !("viewId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);
  const viewId = String(args.viewId);

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  const view = await findMapViewById(viewId);
  if (!view) {
    logger.info(`View ${viewId} not found.`);
    return false;
  }

  const map = await findMapById(view.mapId);
  if (!map) {
    logger.info(`Map ${view.mapId} not found.`);
    return false;
  }

  const dataSourceView = view.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSourceId,
  );

  logger.info(
    `Tagging data source ${dataSourceId} with view ${view.name} (${view.id})`,
  );

  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.error(
      `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`,
    );
    return false;
  }

  try {
    let count = 0;
    const total = (
      await countDataRecordsForDataSource(dataSourceId, null, null)
    ).count;
    const records = streamDataRecordsByDataSource(
      dataSourceId,
      dataSourceView?.filter,
      dataSourceView?.search,
    );
    const batches = batchAsync(records, DATA_SOURCE_JOB_BATCH_SIZE);

    for await (const batch of batches) {
      const taggedRecords: TaggedRecord[] = batch.map((record) => {
        return {
          externalId: record.externalId,
          json: record.json,
          tag: {
            name: `Mapped View: ${map.name} / ${view.name}`,
            present: Boolean(record.mappedMatched),
          },
        };
      });
      await adaptor.tagRecords(taggedRecords);
      count += batch.length;
      if (total) {
        const percentComplete = Math.floor((count * 100) / total);
        logger.info(
          `Tagged ${count} records of ${total}, ${percentComplete}% complete`,
        );
      } else {
        logger.info(`Tagged ${count} records`);
      }
    }

    logger.info(
      `Tagged data source ${dataSourceId} with view ${view.name} (${view.id})`,
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to tag records for ${dataSource.config.type} ${dataSourceId}`,
      { error },
    );
  }

  return false;
};

export default tagDataSource;
