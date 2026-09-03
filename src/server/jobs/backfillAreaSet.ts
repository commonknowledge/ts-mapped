import { sql } from "kysely";
import { AreaSetCode } from "@/models/AreaSet";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { sleep } from "@/utils/async";

const DEFAULT_BATCH_SIZE = 2000;

/**
 * Add a newly imported area set to the `geocodeResult.areas` of every already
 * geocoded record in one data source, without re-geocoding.
 *
 * Each record's stored `samplePoint` is spatially joined against the area
 * table, so no external geocoding API is called. The update is set-based and
 * paged on the primary key, so each statement is short and the job can be
 * safely retried: records that already have the area set key are skipped.
 */
const backfillAreaSet = async (args: object | null): Promise<boolean> => {
  if (!args || !("dataSourceId" in args) || !("areaSetCode" in args)) {
    return false;
  }
  const dataSourceId = String(args.dataSourceId);
  const areaSetCode = String(args.areaSetCode);
  if (!Object.values(AreaSetCode).includes(areaSetCode as AreaSetCode)) {
    logger.error(`Unknown area set code: ${areaSetCode}`);
    return false;
  }
  const batchSize =
    "batchSize" in args && Number(args.batchSize) > 0
      ? Number(args.batchSize)
      : DEFAULT_BATCH_SIZE;
  const batchIntervalMillis =
    "batchIntervalMillis" in args ? Number(args.batchIntervalMillis) || 0 : 0;

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  logger.info(
    `Backfilling ${areaSetCode} for data source ${dataSource.name} (${dataSourceId})`,
  );

  let lastId: string | null = null;
  let scanned = 0;
  let updated = 0;

  for (;;) {
    let idsQuery = db
      .selectFrom("dataRecord")
      .select("id")
      .where("dataSourceId", "=", dataSourceId)
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
        AND dr.data_source_id = ${dataSourceId}
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

  logger.info(
    `Backfilled ${areaSetCode} for ${dataSource.name}: scanned ${scanned}, updated ${updated}`,
  );
  return true;
};

export default backfillAreaSet;
