/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

/**
 * Records store their date, parsed at import from the data source's date
 * column role and date format.
 *
 * Existing records are backfilled out of band, by the backfillRecordDates
 * command: a pass over every data record is far too slow for the deploy
 * pipeline, and the ALTER TABLE lock would be held for its whole duration.
 * Until it has run, records imported before this migration have a null date,
 * and so are excluded by the timeline filter.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("data_record")
    .addColumn("date", "timestamptz")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("data_record").dropColumn("date").execute();
}
