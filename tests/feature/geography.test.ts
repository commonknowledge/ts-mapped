import { afterAll, describe, expect, test } from "vitest";
import { DataSourceRecordType, DataSourceType } from "@/models/DataSource";
import { GeocodingType } from "@/models/DataSource";
import { FilterType } from "@/models/MapView";
import importDataSource from "@/server/jobs/importDataSource";
import {
  streamDataRecordsByDataSource,
  upsertDataRecords,
} from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
} from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";
import { toGeography } from "@/server/services/database/geography";

/**
 * Geography values are written explicitly via `toGeography` and parsed on
 * read by the PointPlugin. A JSONB value that happens to have `lat`/`lng`
 * keys must be stored as JSON, not turned into a point.
 */
describe("geography columns", () => {
  const toRemove: string[] = [];

  afterAll(async () => {
    for (const id of toRemove) {
      await deleteDataSource(id);
    }
  });

  const createSource = async (config: {
    type: DataSourceType.CSV;
    url: string;
  }) => {
    const org = await upsertOrganisation({ name: "Test Geography Org" });
    const dataSource = await createDataSource({
      name: "Test Geography Source",
      autoEnrich: false,
      autoImport: false,
      recordType: DataSourceRecordType.Other,
      config,
      columnDefs: [],
      columnMetadata: [],
      columnRoles: { nameColumns: [] },
      enrichments: [],
      geocodingConfig: { type: GeocodingType.None },
      organisationId: org.id,
      public: false,
    });
    toRemove.push(dataSource.id);
    return dataSource;
  };

  const readRecords = async (dataSourceId: string) => {
    const stream = streamDataRecordsByDataSource(
      dataSourceId,
      { type: FilterType.MULTI },
      "",
    );
    const records = [];
    for await (const record of stream) {
      records.push(record);
    }
    return records.sort((a, b) => a.externalId.localeCompare(b.externalId));
  };

  test("toGeography round-trips a point through a geography column", async () => {
    // Config is unique per organisation, so use a distinct (unused) URL
    const dataSource = await createSource({
      type: DataSourceType.CSV,
      url: "file://tests/resources/members.csv",
    });
    const point = { lat: 51.5074, lng: -0.1278 };
    await upsertDataRecords([
      {
        externalId: "with-point",
        dataSourceId: dataSource.id,
        json: { name: "London" },
        geocodePoint: point,
        geocodeResult: null,
      },
      {
        externalId: "without-point",
        dataSourceId: dataSource.id,
        json: { name: "Nowhere" },
        geocodePoint: null,
        geocodeResult: null,
      },
    ]);

    const records = await readRecords(dataSource.id);
    expect(records.map((r) => r.geocodePoint)).toEqual([point, null]);

    const row = await db
      .selectFrom("geocodeCache")
      .select("point")
      .where("address", "=", "geography-test")
      .executeTakeFirst();
    expect(row).toBeUndefined();
    await db
      .insertInto("geocodeCache")
      .values({ address: "geography-test", point: toGeography(point) })
      .onConflict((oc) => oc.column("address").doNothing())
      .execute();
    const cached = await db
      .selectFrom("geocodeCache")
      .select("point")
      .where("address", "=", "geography-test")
      .executeTakeFirstOrThrow();
    expect(cached.point).toEqual(point);
    await db
      .deleteFrom("geocodeCache")
      .where("address", "=", "geography-test")
      .execute();
  });

  test("record JSON with lat and lng keys is stored as JSON, not a point", async () => {
    const dataSource = await createSource({
      type: DataSourceType.CSV,
      url: "file://tests/resources/lat_lng_columns.csv",
    });

    const ok = await importDataSource({ dataSourceId: dataSource.id });
    expect(ok).toBe(true);

    const records = await readRecords(dataSource.id);
    expect(records.map((r) => r.json)).toEqual([
      { name: "HMP Thameside", lat: 51.49451, lng: 0.08685 },
      { name: "HMP North Sea Camp", lat: 52.93997, lng: 0.06344 },
    ]);
  });
});
