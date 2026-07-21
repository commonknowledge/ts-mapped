/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "date-fns";
import { sql } from "kysely";
import type { Kysely } from "kysely";

const BATCH_SIZE = 1000;

// Self-contained copy of parseRecordDate at migration time: the data
// source's dateFormat first, then strict ISO datetimes, else null
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T/;

function parseRecordDate({
  json,
  dateColumn,
  dateFormat,
}: {
  json: Record<string, unknown>;
  dateColumn: string | null | undefined;
  dateFormat: string | null | undefined;
}): Date | null {
  if (!dateColumn || !json[dateColumn]) {
    return null;
  }
  const str = String(json[dateColumn]);
  const parsed = parse(str, dateFormat || "yyyy-MM-dd", new Date());
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  if (ISO_DATETIME_REGEX.test(str)) {
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }
  return null;
}

/**
 * Records store their date, parsed at import from the data source's date
 * column role and date format. Backfills existing records by running the
 * parser over each data source with a date column.
 *
 * NB the migration db is the app instance: the query builder speaks
 * camelCase (CamelCasePlugin), raw SQL speaks snake_case.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("data_record")
    .addColumn("date", "timestamptz")
    .execute();

  const dataSources = await db
    .selectFrom("dataSource")
    .select(["id", "columnRoles", "dateFormat"])
    .execute();

  for (const dataSource of dataSources) {
    const dateColumn = dataSource.columnRoles?.dateColumn;
    if (!dateColumn) {
      continue;
    }
    let lastId: string | null = null;
    for (;;) {
      let query = db
        .selectFrom("dataRecord")
        .select(["id", "json"])
        .where("dataSourceId", "=", dataSource.id)
        .orderBy("id")
        .limit(BATCH_SIZE);
      if (lastId !== null) {
        query = query.where("id", ">", lastId);
      }
      const records = await query.execute();
      if (records.length === 0) {
        break;
      }
      const updates: { id: string; date: Date }[] = [];
      for (const record of records) {
        const date = parseRecordDate({
          json: record.json,
          dateColumn,
          dateFormat: dataSource.dateFormat,
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
      lastId = records[records.length - 1].id;
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("data_record").dropColumn("date").execute();
}
