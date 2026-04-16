import { sql } from "kysely";
import { GeocodingType } from "@/models/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import type { AddressGeocodingConfig } from "@/models/DataSource";
import type { Point } from "@/models/shared";

export default async function populateGeocodeCache() {
  const dataSources = await db
    .selectFrom("dataSource")
    .select(["id", "name", "geocodingConfig"])
    .where(sql`geocoding_config->>'type'`, "=", GeocodingType.Address)
    .execute();

  logger.info(`Found ${dataSources.length} address-geocoded data sources`);

  let totalInserted = 0;

  for (const dataSource of dataSources) {
    const config = dataSource.geocodingConfig as AddressGeocodingConfig;
    const addressColumns = config.columns;

    const records = await db
      .selectFrom("dataRecord")
      .select(["json", "geocodePoint"])
      .where("dataSourceId", "=", dataSource.id)
      .execute();

    const entries: { address: string; point: Point | null }[] = [];
    for (const record of records) {
      const json = record.json as Record<string, unknown>;
      const address = addressColumns
        .map((c) => json[c] || "")
        .filter(Boolean)
        .join(", ")
        .trim();
      if (!address) continue;

      entries.push({ address, point: record.geocodePoint as Point | null });
    }

    if (entries.length === 0) {
      logger.info(`  ${dataSource.name}: no records, skipping`);
      continue;
    }

    // Deduplicate by address within this data source
    const uniqueByAddress = new Map(entries.map((e) => [e.address, e]));
    const deduplicated = Array.from(uniqueByAddress.values());

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < deduplicated.length; i += batchSize) {
      const batch = deduplicated.slice(i, i + batchSize);
      await db
        .insertInto("geocodeCache")
        .values(batch)
        .onConflict((oc) => oc.column("address").doNothing())
        .execute();
      inserted += batch.length;
    }

    logger.info(
      `  ${dataSource.name}: inserted ${inserted} cache entries from ${records.length} records`,
    );
    totalInserted += inserted;
  }

  logger.info(`Done. Inserted ${totalInserted} total cache entries.`);
}
