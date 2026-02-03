import { sleep } from "@/utils/async";
import { geocodeRecord } from "../mapping/geocode";
import { upsertDataRecords } from "../repositories/DataRecord";
import { db } from "../services/database";
import logger from "../services/logger";
import { batch } from "../utils";

const regeocode = async ({
  onlyIds,
  excludeId,
  batchSize,
  batchIntervalMillis,
}: {
  onlyIds?: string[];
  excludeId?: string;
  batchSize?: number;
  batchIntervalMillis?: number;
}) => {
  let dataSourceQuery = db.selectFrom("dataSource").selectAll();
  if (onlyIds && onlyIds.length) {
    dataSourceQuery = dataSourceQuery.where("id", "in", onlyIds);
  }
  if (excludeId) {
    dataSourceQuery = dataSourceQuery.where("id", "!=", excludeId);
  }
  const dataSources = await dataSourceQuery.execute();
  const dataSourcesTotal = dataSources.length;
  let dataSourcesComplete = 0;
  for (const dataSource of dataSources) {
    const records = await db
      .selectFrom("dataRecord")
      .selectAll()
      .where("dataSourceId", "=", dataSource.id)
      .execute();
    logger.info(
      `Re-geocoding ${records.length} records from data source ${dataSource.name} (${dataSource.id})`,
    );
    const batches = batch(records, batchSize || 100);
    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      const geocodedRecords = await Promise.all(
        b.map(async (r) => {
          const geocodeResult = await geocodeRecord(
            r,
            dataSource.geocodingConfig,
          );
          return {
            externalId: r.externalId,
            json: r.json,
            geocodeResult: geocodeResult,
            geocodePoint: geocodeResult?.centralPoint,
            dataSourceId: dataSource.id,
          };
        }),
      );
      await upsertDataRecords(geocodedRecords);
      logger.info(`Processed batch ${i + 1} of ${batches.length}`);

      if (batchIntervalMillis && i < batches.length - 1) {
        logger.info(`Sleeping for ${batchIntervalMillis} milliseconds`);
        await sleep(batchIntervalMillis);
      }
    }

    dataSourcesComplete++;
    logger.info(`Processed ${dataSourcesComplete} of ${dataSourcesTotal}`);
  }
};

export default regeocode;
