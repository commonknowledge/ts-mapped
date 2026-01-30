import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/rest/data-sources/[dataSourceId]/geojson/route";
import {
  ColumnType,
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { upsertDataRecord } from "@/server/repositories/DataRecord";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import type { Feature } from "geojson";

describe("GeoJSON REST API", () => {
  let testUser: Awaited<ReturnType<typeof upsertUser>>;
  let testOrganisation: Awaited<ReturnType<typeof upsertOrganisation>>;
  let testDataSource: Awaited<ReturnType<typeof createDataSource>>;
  const testPassword = "testPassword123";

  beforeAll(async () => {
    console.warn("Set npm config set strict-ssl false");

    // Create test user
    testUser = await upsertUser({
      email: `test-geojson-${uuidv4()}@example.com`,
      password: testPassword,
      name: "Test User",
      avatarUrl: null,
    });

    // Create test organisation
    testOrganisation = await upsertOrganisation({
      name: "Test Organisation GeoJSON",
    });

    // Add user to organisation
    await db
      .insertInto("organisationUser")
      .values({
        organisationId: testOrganisation.id,
        userId: testUser.id,
      })
      .execute();

    // Create test data source
    const name = "Test Data Source";
    testDataSource =
      (await db
        .selectFrom("dataSource")
        .where("name", "=", name)
        .selectAll()
        .executeTakeFirst()) ||
      (await createDataSource({
        name,
        recordType: DataSourceRecordType.Locations,
        autoEnrich: false,
        autoImport: false,
        public: false,
        config: {
          type: DataSourceType.CSV,
          url: "https://example.com/test.csv",
        },
        columnDefs: [
          { name: "name", type: ColumnType.String },
          { name: "address", type: ColumnType.String },
        ],
        columnRoles: { nameColumns: ["name"] },
        geocodingConfig: { type: GeocodingType.None },
        enrichments: [],
        organisationId: testOrganisation.id,
      }));

    // Add test data records with geocoded points
    await upsertDataRecord({
      externalId: "record-1",
      dataSourceId: testDataSource.id,
      json: { name: "Location 1", address: "123 Main St" },
      geocodePoint: { lat: 51.5074, lng: -0.1278 }, // London
      geocodeResult: {
        areas: {},
        centralPoint: { lat: 51.5074, lng: -0.1278 },
        samplePoint: { lat: 51.5074, lng: -0.1278 },
      },
      needsEnrich: false,
      needsImport: false,
    });

    await upsertDataRecord({
      externalId: "record-2",
      dataSourceId: testDataSource.id,
      json: { name: "Location 2", address: "456 Elm St" },
      geocodePoint: { lat: 40.7128, lng: -74.006 }, // New York
      geocodeResult: {
        areas: {},
        centralPoint: { lat: 40.7128, lng: -74.006 },
        samplePoint: { lat: 40.7128, lng: -74.006 },
      },
      needsEnrich: false,
      needsImport: false,
    });

    // Add a record without geocoding (should be excluded)
    await upsertDataRecord({
      externalId: "record-3",
      dataSourceId: testDataSource.id,
      json: { name: "Location 3", address: "789 Oak St" },
      geocodePoint: null,
      geocodeResult: null,
      needsEnrich: false,
      needsImport: false,
    });
  });

  it("should return 401 without authentication", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid credentials", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
        credentials: { email: testUser.email, password: "wrongpassword" },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );
    expect(response.status).toBe(401);
  });

  it("should return 404 for non-existent data source", async () => {
    const id = uuidv4();
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${id}/geojson`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: id }),
      },
    );
    expect(response.status).toBe(404);
  });

  it("should return GeoJSON for valid request", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/geo+json",
    );

    const geojson =
      (await response.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2); // Only geocoded records

    // Check first feature
    const feature1 = geojson.features.find(
      (f: Feature) => f.properties?.name === "Location 1",
    );
    expect(feature1).toBeDefined();
    expect(feature1?.type).toBe("Feature");
    expect(feature1?.geometry.type).toBe("Point");
    expect(feature1?.geometry.coordinates).toEqual([-0.1278, 51.5074]);
    expect(feature1?.properties?.name).toBe("Location 1");
    expect(feature1?.properties?.address).toBe("123 Main St");
    expect(feature1?.properties?._dataSourceId).toBe(testDataSource.id);

    // Check second feature
    const feature2 = geojson.features.find(
      (f: Feature) => f.properties?.name === "Location 2",
    );
    expect(feature2).toBeDefined();
    expect(feature2?.geometry.coordinates).toEqual([-74.006, 40.7128]);
  });

  it("should return 403 for user without access to data source", async () => {
    // Create another user not in the organisation
    const otherUser = await upsertUser({
      email: `other-user-${uuidv4()}@example.com`,
      password: testPassword,
      name: "Other User",
      avatarUrl: null,
    });

    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
        credentials: { email: otherUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );
    expect(response.status).toBe(403);
  });

  it("should support search query parameter", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson?search=Location%201`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(200);
    const geojson =
      (await response.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(geojson.type).toBe("FeatureCollection");
    // Search should filter to only Location 1
    expect(geojson.features.length).toBeGreaterThan(0);
    expect(
      geojson.features.some(
        (f: Feature) => f.properties?.name === "Location 1",
      ),
    ).toBe(true);
  });

  it("should support pagination with page parameter", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson?page=0&all=false`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(200);
    const geojson =
      (await response.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(geojson.type).toBe("FeatureCollection");
    expect(Array.isArray(geojson.features)).toBe(true);
  });

  it("should support all parameter to get all records", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson?all=true`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(200);
    const geojson =
      (await response.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2);
  });

  it("should support sort parameter", async () => {
    const sortParam = JSON.stringify([{ name: "name", desc: true }]);
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson?sort=${encodeURIComponent(sortParam)}&all=true`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(200);
    const geojson =
      (await response.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2);
    // Sorted descending by name, so Location 2 should come first
    expect(geojson.features[0]?.properties?.name).toBe("Location 2");
  });

  it("should return 400 for invalid query parameters", async () => {
    const response = await GET(
      createNextRequest({
        url: `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson?page=invalid`,
        credentials: { email: testUser.email, password: testPassword },
      }),
      {
        params: Promise.resolve({ dataSourceId: testDataSource.id }),
      },
    );

    expect(response.status).toBe(400);
    const error = (await response.json()) as { error: string };
    expect(error.error).toBe("Invalid query parameters");
  });
});

const createNextRequest = ({
  url,
  credentials,
}: {
  url: string;
  credentials?: { email: string; password: string } | null | undefined;
}) => {
  const authorization = credentials
    ? Buffer.from(`${credentials.email}:${credentials.password}`).toString(
        "base64",
      )
    : "";
  return new NextRequest(url, {
    headers: authorization ? { Authorization: `Basic ${authorization}` } : {},
  });
};
