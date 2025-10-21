import { describe, it, expect, beforeAll } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/server/services/database";
import { upsertUser } from "@/server/repositories/User";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertDataRecord } from "@/server/repositories/DataRecord";
import { DataSourceType, GeocodingType, ColumnType, DataSourceRecordType } from "@/server/models/DataSource";

describe("GeoJSON REST API", () => {
  let testUser: Awaited<ReturnType<typeof upsertUser>>;
  let testOrganisation: Awaited<ReturnType<typeof upsertOrganisation>>;
  let testDataSource: Awaited<ReturnType<typeof createDataSource>>;
  const testPassword = "testPassword123";

  beforeAll(async () => {
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
    testDataSource = await createDataSource({
      name: "Test Data Source",
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
    });

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
    const response = await fetch(
      `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`
    );
    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid credentials", async () => {
    const credentials = Buffer.from(
      `${testUser.email}:wrongpassword`
    ).toString("base64");
    const response = await fetch(
      `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    expect(response.status).toBe(401);
  });

  it("should return 404 for non-existent data source", async () => {
    const credentials = Buffer.from(
      `${testUser.email}:${testPassword}`
    ).toString("base64");
    const response = await fetch(
      `http://localhost:3000/api/rest/data-sources/${uuidv4()}/geojson`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    expect(response.status).toBe(404);
  });

  it("should return GeoJSON for valid request", async () => {
    const credentials = Buffer.from(
      `${testUser.email}:${testPassword}`
    ).toString("base64");
    const response = await fetch(
      `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/geo+json"
    );

    const geojson = await response.json();
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2); // Only geocoded records

    // Check first feature
    const feature1 = geojson.features.find(
      (f: any) => f.properties.name === "Location 1"
    );
    expect(feature1).toBeDefined();
    expect(feature1.type).toBe("Feature");
    expect(feature1.geometry.type).toBe("Point");
    expect(feature1.geometry.coordinates).toEqual([-0.1278, 51.5074]);
    expect(feature1.properties.name).toBe("Location 1");
    expect(feature1.properties.address).toBe("123 Main St");
    expect(feature1.properties._dataSourceId).toBe(testDataSource.id);

    // Check second feature
    const feature2 = geojson.features.find(
      (f: any) => f.properties.name === "Location 2"
    );
    expect(feature2).toBeDefined();
    expect(feature2.geometry.coordinates).toEqual([-74.006, 40.7128]);
  });

  it("should return 403 for user without access to data source", async () => {
    // Create another user not in the organisation
    const otherUser = await upsertUser({
      email: `other-user-${uuidv4()}@example.com`,
      password: testPassword,
      name: "Other User",
      avatarUrl: null,
    });

    const credentials = Buffer.from(
      `${otherUser.email}:${testPassword}`
    ).toString("base64");
    const response = await fetch(
      `http://localhost:3000/api/rest/data-sources/${testDataSource.id}/geojson`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    expect(response.status).toBe(403);
  });
});
