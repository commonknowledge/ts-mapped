import { sql } from "kysely";
import { AreaSetCode } from "@/models/AreaSet";
import { sleep } from "@/utils/async";
import { db } from "../services/database";
import logger from "../services/logger";

/**
 * Add a newly imported area set to the `geocodeResult.areas` of every already
 * geocoded record, without re-geocoding.
 *
 * Each record's stored `samplePoint` is spatially joined against the area
 * table, so no external geocoding API is called. Updates are set-based and
 * paged on the primary key, so each statement is short and holds no long-lived
 * lock. Records that already have the area set key are skipped, so the command
 * is idempotent and safe to interrupt.
 *
 * Data sources are processed in ID order and each completed ID is logged.
 * Resume an interrupted run with `fromDataSourceId` set to the last logged ID.
 */
const backfillAreaSet = async ({
  areaSetCode,
  onlyIds,
  fromDataSourceId,
  batchSize = 2000,
  batchIntervalMillis = 0,
}: {
  areaSetCode: string;
  onlyIds?: string[];
  fromDataSourceId?: string | null;
  batchSize?: number;
  batchIntervalMillis?: number;
}) => {
  if (!Object.values(AreaSetCode).includes(areaSetCode as AreaSetCode)) {
    throw new Error(`Unknown area set code: ${areaSetCode}`);
  }

  let query = db.selectFrom("dataSource").select(["id", "name"]).orderBy("id");
  if (onlyIds && onlyIds.length) {
    query = query.where("id", "in", onlyIds);
  }
  if (fromDataSourceId) {
    query = query.where("id", ">", fromDataSourceId);
  }
  const dataSources = await query.execute();

  logger.info(
    `Backfilling ${areaSetCode} for ${dataSources.length} data sources`,
  );

  let totalUpdated = 0;
  for (let i = 0; i < dataSources.length; i++) {
    const dataSource = dataSources[i];
    const updated = await backfillDataSource({
      dataSource,
      areaSetCode,
      batchSize,
      batchIntervalMillis,
    });
    totalUpdated += updated;
    logger.info(
      `Completed ${i + 1} of ${dataSources.length}: ${dataSource.name} (${dataSource.id}), updated ${updated}`,
    );
  }

  logger.info(`Done: backfilled ${areaSetCode} on ${totalUpdated} records`);
};

const backfillDataSource = async ({
  dataSource,
  areaSetCode,
  batchSize,
  batchIntervalMillis,
}: {
  dataSource: { id: string; name: string };
  areaSetCode: string;
  batchSize: number;
  batchIntervalMillis: number;
}): Promise<number> => {
  let lastId: string | null = null;
  let scanned = 0;
  let updated = 0;

  for (;;) {
    let idsQuery = db
      .selectFrom("dataRecord")
      .select("id")
      .where("dataSourceId", "=", dataSource.id)
      .orderBy("id")
      .limit(batchSize);
    if (lastId !== null) {
      idsQuery = idsQuery.where("id", ">", lastId);
    }
    const ids = await idsQuery.execute();
    if (ids.length === 0) {
      break;
    }
    const chunkEnd = ids[ids.length - 1].id;

    const result = await sql`
      UPDATE data_record dr
      SET geocode_result = jsonb_set(
        dr.geocode_result,
        ARRAY['areas', ${areaSetCode}],
        to_jsonb(a.code)
      )
      FROM area a
      INNER JOIN area_set s ON a.area_set_id = s.id
      WHERE s.code = ${areaSetCode}
        AND dr.data_source_id = ${dataSource.id}
        AND dr.id > ${lastId ?? 0}
        AND dr.id <= ${chunkEnd}
        AND dr.geocode_result IS NOT NULL
        AND dr.geocode_result->'samplePoint' IS NOT NULL
        AND NOT (dr.geocode_result->'areas' ? ${areaSetCode})
        AND ST_Covers(
          a.geom,
          ST_SetSRID(
            ST_MakePoint(
              (dr.geocode_result->'samplePoint'->>'lng')::float,
              (dr.geocode_result->'samplePoint'->>'lat')::float
            ),
            4326
          )
        )
    `.execute(db);

    scanned += ids.length;
    updated += Number(result.numAffectedRows ?? 0);
    lastId = chunkEnd;
    logger.info(
      `${dataSource.name}: scanned ${scanned} records, updated ${updated} (ID ${lastId})`,
    );

    if (batchIntervalMillis) {
      await sleep(batchIntervalMillis);
    }
  }

  return updated;
};

export default backfillAreaSet;
