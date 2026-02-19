import { DATA_SOURCE_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import TaggingComplete from "@/server/emails/TaggingComplete";
import TaggingFailed from "@/server/emails/TaggingFailed";
import {
  countDataRecordsForDataSource,
  streamDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findMapViewById } from "@/server/repositories/MapView";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import { batchAsync } from "@/server/utils";
import { findMapById } from "../repositories/Map";
import type { TaggedRecord } from "@/types";

const sendFailureEmail = async (
  userEmail: string,
  dataSourceName: string,
  viewName: string,
  reason: string,
) => {
  try {
    await sendEmail(
      userEmail,
      "Tagging failed",
      TaggingFailed({ dataSourceName, viewName, reason }),
    );
  } catch (error) {
    logger.error("Failed to send tagging failure email", { error });
  }
};

const tagDataSource = async (args: object | null): Promise<boolean> => {
  if (
    !args ||
    !("dataSourceId" in args) ||
    !("viewId" in args) ||
    !("userEmail" in args)
  ) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);
  const viewId = String(args.viewId);
  const userEmail = String(args.userEmail);

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    const reason = `Failed to tag data source: ${dataSourceId} not found.`;
    logger.warn(reason);
    await sendFailureEmail(userEmail, dataSourceId, viewId, reason);
    return false;
  }

  const view = await findMapViewById(viewId);
  if (!view) {
    const reason = `View ${viewId} not found.`;
    logger.warn(`Failed to tag data source ${dataSourceId}: ${reason}`);
    await sendFailureEmail(userEmail, dataSource.name, viewId, reason);
    return false;
  }

  const map = await findMapById(view.mapId);
  if (!map) {
    const reason = `Map ${view.mapId} not found.`;
    logger.warn(`Failed to tag data source ${dataSourceId}: ${reason}`);
    await sendFailureEmail(userEmail, dataSource.name, view.name, reason);
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
    const reason = `Could not get data source adaptor for source ${dataSourceId}, type ${dataSource.config.type}`;
    logger.error(reason);
    await sendFailureEmail(userEmail, dataSource.name, view.name, reason);
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

    try {
      await sendEmail(
        userEmail,
        "Tagging complete",
        TaggingComplete({
          dataSourceName: dataSource.name,
          viewName: view.name,
        }),
      );
    } catch (error) {
      logger.error("Failed to send tagging success email", { error });
    }

    return true;
  } catch (error) {
    const reason = `Failed to tag records for ${dataSource.config.type} ${dataSourceId}`;
    logger.error(reason, { error });
    await sendFailureEmail(userEmail, dataSource.name, view.name, reason);
    throw error;
  }
};

export default tagDataSource;
