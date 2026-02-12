/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Index for faster filtering on needsImport flag during importDataRecords
  // This significantly speeds up the WHERE clause: dataSourceId = X AND needsImport = true
  await db.schema
    .createIndex("dataRecordNeedsImportIndex")
    .on("dataRecord")
    .columns(["dataSourceId", "needsImport"])
    .execute();

  // Index for faster filtering on needsEnrich flag during enrichDataRecords
  await db.schema
    .createIndex("dataRecordNeedsEnrichIndex")
    .on("dataRecord")
    .columns(["dataSourceId", "needsEnrich"])
    .execute();

  // Index for faster area lookups by code during geocoding
  // This speeds up findAreaByCode queries significantly
  await db.schema
    .createIndex("areaCodeAreaSetIdIndex")
    .on("area")
    .columns(["code", "areaSetId"])
    .execute();

  // Index for faster area set lookups by code during enrichment
  await db.schema
    .createIndex("areaSetCodeIndex")
    .on("areaSet")
    .column("code")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("dataRecordNeedsImportIndex").execute();
  await db.schema.dropIndex("dataRecordNeedsEnrichIndex").execute();
  await db.schema.dropIndex("areaCodeAreaSetIdIndex").execute();
  await db.schema.dropIndex("areaSetCodeIndex").execute();
}
