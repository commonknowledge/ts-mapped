import { sql } from "kysely";
import { describe, expect, test, vi } from "vitest";
import { GeocodingType } from "@/models/DataSource";
import { geocodeRecord } from "@/server/mapping/geocode";
import { db } from "@/server/services/database";

const MOCK_MAPBOX_RESPONSE = {
  features: [
    {
      id: "mock-feature",
      geometry: {
        type: "Point",
        coordinates: [-0.1276, 51.5034],
      },
    },
  ],
};

describe("geocode cache", () => {
  test("mapbox geocoder caches results and does not call the API on subsequent lookups", async () => {
    const address = "10 Downing Street, London";

    // Clean up any existing cache entry for this address
    await db
      .deleteFrom("geocodeCache")
      .where("address", "=", address)
      .execute();

    const geocodingConfig = {
      type: GeocodingType.Address as const,
      columns: ["Address"],
    };

    const dataRecord = {
      externalId: "cache-test-1",
      json: { Address: address },
    };

    const originalFetch = global.fetch;
    const fetchSpy = vi.fn<typeof fetch>((input, init) => {
      const url = input instanceof URL ? input.href : String(input);
      if (url.includes("api.mapbox.com")) {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_MAPBOX_RESPONSE), { status: 200 }),
        );
      }
      return originalFetch(input, init);
    });
    global.fetch = fetchSpy;

    try {
      // First call — should hit the Mapbox API
      const result1 = await geocodeRecord(dataRecord, geocodingConfig);
      expect(result1).not.toBeNull();
      expect(result1?.centralPoint).toEqual({ lat: 51.5034, lng: -0.1276 });

      const mapboxCalls1 = fetchSpy.mock.calls.filter((call) =>
        String(call[0]).includes("api.mapbox.com"),
      );
      expect(mapboxCalls1.length).toBe(1);

      fetchSpy.mockClear();

      // Second call — should use the cache, no Mapbox API call
      const result2 = await geocodeRecord(dataRecord, geocodingConfig);
      expect(result2).not.toBeNull();
      expect(result2?.centralPoint).toEqual(result1?.centralPoint);

      const mapboxCalls2 = fetchSpy.mock.calls.filter((call) =>
        String(call[0]).includes("api.mapbox.com"),
      );
      expect(mapboxCalls2.length).toBe(0);
    } finally {
      global.fetch = originalFetch;

      // Clean up
      await db
        .deleteFrom("geocodeCache")
        .where("address", "=", address)
        .execute();
    }
  });

  test("expired cache entries are re-geocoded", async () => {
    const address = "Buckingham Palace, London";

    // Clean up any existing cache entry
    await db
      .deleteFrom("geocodeCache")
      .where("address", "=", address)
      .execute();

    // Insert a cache entry with a created_at older than 4 weeks
    await db
      .insertInto("geocodeCache")
      .values({
        address,
        point: { lat: 0, lng: 0 },
      })
      .execute();
    await db
      .updateTable("geocodeCache")
      .set({ createdAt: sql`now() - interval '5 weeks'` })
      .where("address", "=", address)
      .execute();

    const geocodingConfig = {
      type: GeocodingType.Address as const,
      columns: ["Address"],
    };

    const dataRecord = {
      externalId: "cache-test-expired",
      json: { Address: address },
    };

    const originalFetch = global.fetch;
    const fetchSpy = vi.fn<typeof fetch>((input, init) => {
      const url = input instanceof URL ? input.href : String(input);
      if (url.includes("api.mapbox.com")) {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_MAPBOX_RESPONSE), { status: 200 }),
        );
      }
      return originalFetch(input, init);
    });
    global.fetch = fetchSpy;

    try {
      const result = await geocodeRecord(dataRecord, geocodingConfig);
      expect(result).not.toBeNull();
      expect(result?.centralPoint).toEqual({ lat: 51.5034, lng: -0.1276 });

      // Should have called Mapbox because the cache entry was expired
      const mapboxCalls = fetchSpy.mock.calls.filter((call) =>
        String(call[0]).includes("api.mapbox.com"),
      );
      expect(mapboxCalls.length).toBe(1);

      // Verify the cache was updated with the new point
      const cached = await db
        .selectFrom("geocodeCache")
        .select(["point", "createdAt"])
        .where("address", "=", address)
        .executeTakeFirst();
      expect(cached?.point).toEqual({ lat: 51.5034, lng: -0.1276 });
    } finally {
      global.fetch = originalFetch;

      await db
        .deleteFrom("geocodeCache")
        .where("address", "=", address)
        .execute();
    }
  });
});
