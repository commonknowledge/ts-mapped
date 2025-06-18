import { DATA_SOURCE_JOB_BATCH_SIZE } from "@/constants";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { enrichRecord } from "@/server/mapping/enrich";
import { DataSource } from "@/server/models/DataSource";
import { findDataSourceById } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import pubSub from "@/server/services/pubsub";
import { batchAsync } from "@/server/utils";
import { ExternalRecord } from "@/types";

const enrichDataSource = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);

  logger.info(`Enriching data source ${dataSourceId}`);

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
    const total = await adaptor.getRecordCount();
    const records = adaptor.fetchAll();
    const batches = batchAsync(records, DATA_SOURCE_JOB_BATCH_SIZE);

    for await (const batch of batches) {
      const enrichedRecords = await enrichBatch(batch, dataSource);
      await adaptor.updateRecords(enrichedRecords);
      count += batch.length;
      if (total) {
        const percentComplete = Math.floor((count * 100) / total);
        logger.info(
          `Enriched ${count} records of ${total}, ${percentComplete}% complete`,
        );
      } else {
        logger.info(`Enriched ${count} records`);
      }
      pubSub.publish("dataSourceEvent", {
        dataSourceEvent: {
          dataSourceId: dataSource.id,
          recordsEnriched: {
            at: new Date().toISOString(),
            count,
          },
        },
      });
    }

    pubSub.publish("dataSourceEvent", {
      dataSourceEvent: {
        dataSourceId: dataSource.id,
        enrichmentComplete: {
          at: new Date().toISOString(),
        },
      },
    });

    logger.info(`Enriched data source ${dataSource.id}: ${dataSource.name}`);
    return true;
  } catch (error) {
    pubSub.publish("dataSourceEvent", {
      dataSourceEvent: {
        dataSourceId: dataSource.id,
        enrichmentComplete: {
          at: new Date().toISOString(),
        },
      },
    });

    logger.error(
      `Failed to enrich records for ${dataSource.config.type} ${dataSourceId}`,
      { error },
    );
  }

  return false;
};

export const enrichBatch = (batch: ExternalRecord[], dataSource: DataSource) =>
  Promise.all(
    batch.map(async (record) => {
      return enrichRecord(record, dataSource);
    }),
  );

export default enrichDataSource;
