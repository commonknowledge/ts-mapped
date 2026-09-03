import { AreaSetCode } from "@/models/AreaSet";
import { db } from "../services/database";
import logger from "../services/logger";
import { DEFAULT_QUEUE, enqueue } from "../services/queue";

/**
 * Enqueue one `backfillAreaSet` job per data source.
 *
 * Each job is idempotent and pg-boss records completion, so an interrupted run
 * resumes automatically: completed data sources are not re-processed. Jobs go
 * on the default queue, so they are picked up by the regular workers.
 */
const backfillAreaSet = async ({
  areaSetCode,
  onlyIds,
  batchSize,
  batchIntervalMillis,
  queue = DEFAULT_QUEUE,
}: {
  areaSetCode: string;
  onlyIds?: string[];
  batchSize?: number;
  batchIntervalMillis?: number;
  queue?: string;
}) => {
  if (!Object.values(AreaSetCode).includes(areaSetCode as AreaSetCode)) {
    throw new Error(`Unknown area set code: ${areaSetCode}`);
  }

  let query = db.selectFrom("dataSource").select(["id", "name"]).orderBy("id");
  if (onlyIds && onlyIds.length) {
    query = query.where("id", "in", onlyIds);
  }
  const dataSources = await query.execute();

  for (const dataSource of dataSources) {
    await enqueue(
      "backfillAreaSet",
      `${areaSetCode}-${dataSource.id}`,
      {
        dataSourceId: dataSource.id,
        areaSetCode,
        batchSize,
        batchIntervalMillis,
      },
      queue,
    );
  }

  logger.info(
    `Enqueued ${dataSources.length} backfillAreaSet jobs for ${areaSetCode} on queue "${queue}"`,
  );
};

export default backfillAreaSet;
