/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "kysely";
import type { Kysely } from "kysely";

/**
 * Remove the unused "showBoundaryOutline" flag from view config.
 * Nothing ever read it — boundary outlines are drawn whenever an area set
 * group is selected, and the choropleth fill is gated on "showChoropleth".
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view
    SET config = config - 'showBoundaryOutline'
    WHERE config ? 'showBoundaryOutline'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE map_view
    SET config = jsonb_set(config, '{showBoundaryOutline}', 'false'::jsonb)
    WHERE NOT config ? 'showBoundaryOutline'
  `.execute(db);
}
