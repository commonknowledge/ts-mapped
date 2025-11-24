/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("map_view")
    .set({
      config: sql`jsonb_set(
        config,
        '{calculationType}',
        '"Avg"'
      )`,
    })
    .where(sql`config->>'calculationType'`, "=", "Value")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("map_view")
    .set({
      config: sql`jsonb_set(
        config,
        '{calculationType}',
        '"Value"'
      )`,
    })
    .where(sql`config->>'calculationType'`, "=", "Avg")
    .execute();
}
