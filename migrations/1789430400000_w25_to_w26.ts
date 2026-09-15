/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("map_view")
    .set({
      config: sql`jsonb_set(
        config,
        '{areaSetGroupCode}',
        '"W26"'
      )`,
    })
    .where(sql`config->>'areaSetGroupCode'`, "=", "W25")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .updateTable("map_view")
    .set({
      config: sql`jsonb_set(
        config,
        '{areaSetGroupCode}',
        '"W25"'
      )`,
    })
    .where(sql`config->>'areaSetGroupCode'`, "=", "W26")
    .execute();
}
