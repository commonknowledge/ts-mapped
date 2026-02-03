import { geocodeRecords } from "../mapping/geocode";
import { upsertDataRecords } from "../repositories/DataRecord";
import { db } from "../services/database";
import logger from "../services/logger";
import { batch } from "../utils";

const regeocode = async (
  dataSourceId: string | null = null,
  excludeDataSourceId: string | null = null,
) => {
  let dataSourceQuery = db.selectFrom("dataSource").selectAll();
  if (dataSourceId) {
    dataSourceQuery = dataSourceQuery.where("id", "=", dataSourceId);
  }
  if (excludeDataSourceId) {
    dataSourceQuery = dataSourceQuery.where("id", "!=", excludeDataSourceId);
  }
  const dataSources = await dataSourceQuery.execute();
  for (const dataSource of dataSources) {
    const records = await db
      .selectFrom("dataRecord")
      .selectAll()
      .where("dataSourceId", "=", dataSource.id)
      .execute();
    logger.info(
      `Re-geocoding ${records.length} records from data source ${dataSource.name} (${dataSource.id})`,
    );
    const batches = batch(records, 100);
    for (let i = 0; i < batches.length; i++) {
      const records = batches[i];
      const geocodedRecords = await geocodeRecords(
        records,
        dataSource.geocodingConfig,
      );
      const updatedRecords = records.map((r, i) => {
        const geocodedRecord = geocodedRecords[i];
        return {
          externalId: r.externalId,
          json: r.json,
          geocodeResult: geocodedRecord.geocodeResult,
          geocodePoint: geocodedRecord?.geocodeResult?.centralPoint,
          dataSourceId: dataSource.id,
        };
      });
      await upsertDataRecords(updatedRecords);
      logger.info(`Processed batch ${i + 1} of ${batches.length}`);
    }
  }
};

export default regeocode;
