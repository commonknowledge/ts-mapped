import { sql } from "kysely";
import { sleep } from "@/utils/async";
import { parseRecordDate } from "@/utils/dataRecord";
import { db } from "../services/database";
import logger from "../services/logger";

/**
 * Backfill `dataRecord.date` for records imported before the column existed,
 * using the same parser as the import (the data source's date column role and
 * date format). Records whose data source has no date column, or whose value
 * doesn't parse, keep a null date.
 *
 * This walks the whole table once, paging on the primary key so each batch is
 * an index scan rather than a re-sort, and holds no long-lived lock — it is
 * safe to run against a live database, and to interrupt. Resume an
 * interrupted run by passing the last processed ID as `fromId`.
 */
const backfillRecordDates = async ({
  batchSize = 1000,
  batchIntervalMillis = 0,
  fromId = null,
}: {
  batchSize?: number;
  batchIntervalMillis?: number;
  fromId?: string | null;
}) => {
  const dataSources = await db
    .selectFrom("dataSource")
    .select(["id", "columnRoles", "dateFormat"])
    .execute();

  const dateConfigsBySourceId = new Map<
    string,
    { dateColumn: string; dateFormat: string | null }
  >();
  for (const dataSource of dataSources) {
    const dateColumn = dataSource.columnRoles?.dateColumn;
    if (dateColumn) {
      dateConfigsBySourceId.set(dataSource.id, {
        dateColumn,
        dateFormat: dataSource.dateFormat,
      });
    }
  }

  if (dateConfigsBySourceId.size === 0) {
    logger.info("No data sources have a date column, nothing to backfill");
    return;
  }

  logger.info(
    `Backfilling record dates for ${dateConfigsBySourceId.size} data sources`,
  );

  let lastId = fromId;
  let scanned = 0;
  let updated = 0;

  for (;;) {
    let query = db
      .selectFrom("dataRecord")
      .select(["id", "dataSourceId", "json"])
      .orderBy("id")
      .limit(batchSize);
    if (lastId !== null) {
      query = query.where("id", ">", lastId);
    }
    const records = await query.execute();
    if (records.length === 0) {
      break;
    }

    const updates: { id: string; date: Date }[] = [];
    for (const record of records) {
      const dateConfig = dateConfigsBySourceId.get(record.dataSourceId);
      if (!dateConfig) {
        continue;
      }
      const date = parseRecordDate({
        json: record.json,
        dateColumn: dateConfig.dateColumn,
        dateFormat: dateConfig.dateFormat,
      });
      if (date) {
        updates.push({ id: record.id, date });
      }
    }

    if (updates.length > 0) {
      await sql`
        UPDATE data_record
        SET date = v.date::timestamptz
        FROM (VALUES ${sql.join(
          updates.map((u) => sql`(${u.id}::bigint, ${u.date.toISOString()})`),
        )}) AS v(id, date)
        WHERE data_record.id = v.id
      `.execute(db);
    }

    scanned += records.length;
    updated += updates.length;
    lastId = records[records.length - 1].id;
    logger.info(
      `Scanned ${scanned} records, updated ${updated} (ID ${lastId})`,
    );

    if (batchIntervalMillis) {
      await sleep(batchIntervalMillis);
    }
  }

  logger.info(`Done: scanned ${scanned} records, updated ${updated}`);
};

export default backfillRecordDates;
