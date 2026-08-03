import { sql } from "kysely";
import { describe, expect, test, vi } from "vitest";
import {
  EnrichmentSourceType,
  GeocodeContextType,
  GeocodingType,
} from "@/models/DataSource";
import { getEnrichedColumn } from "@/server/mapping/enrich";
import { geocodeRecord, mapboxReverseGeocode } from "@/server/mapping/geocode";
import { db } from "@/server/services/database";

const MOCK_CONTEXT = {
  place: { name: "London" },
  region: { name: "England" },
};

const MOCK_MAPBOX_RESPONSE = {
  features: [
    {
      id: "mock-feature",
      geometry: {
        type: "Point",
        coordinates: [-0.1276, 51.5034],
      },
      properties: {
        context: MOCK_CONTEXT,
      },
    },
  ],
};

/** Stub fetch for api.mapbox.com only; pass other requests through. */
const mockMapboxFetch = (response: unknown) => {
  const originalFetch = global.fetch;
  const fetchSpy = vi.fn<typeof fetch>((input, init) => {
    const url = input instanceof URL ? input.href : String(input);
    if (url.includes("api.mapbox.com")) {
      return Promise.resolve(
        new Response(JSON.stringify(response), { status: 200 }),
      );
    }
    return originalFetch(input, init);
  });
  global.fetch = fetchSpy;
  return {
    fetchSpy,
    mapboxCalls: () =>
      fetchSpy.mock.calls.filter((call) =>
        String(call[0]).includes("api.mapbox.com"),
      ),
    restore: () => {
      global.fetch = originalFetch;
    },
  };
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
      expect(result1?.geocodeContext).toEqual(MOCK_CONTEXT);

      const mapboxCalls1 = fetchSpy.mock.calls.filter((call) =>
        String(call[0]).includes("api.mapbox.com"),
      );
      expect(mapboxCalls1.length).toBe(1);

      fetchSpy.mockClear();

      // Second call — should use the cache, no Mapbox API call
      const result2 = await geocodeRecord(dataRecord, geocodingConfig);
      expect(result2).not.toBeNull();
      expect(result2?.centralPoint).toEqual(result1?.centralPoint);
      // Context must round-trip through the geocode_cache context column
      expect(result2?.geocodeContext).toEqual(MOCK_CONTEXT);

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

const MOCK_REVERSE_RESPONSE = {
  features: [
    {
      properties: {
        context: {
          place: { name: "Sleaford" },
          region: { name: "England" },
        },
      },
    },
  ],
};

describe("reverse geocode cache", () => {
  test("caches results by rounded coordinates and does not call the API on subsequent lookups", async () => {
    const point = { lng: -0.409, lat: 52.996 };
    const key = "-0.40900,52.99600";

    await db.deleteFrom("reverseGeocodeCache").where("key", "=", key).execute();

    const mapbox = mockMapboxFetch(MOCK_REVERSE_RESPONSE);
    try {
      // First call — should hit the Mapbox API and store the context
      const context1 = await mapboxReverseGeocode(point);
      expect(context1).toEqual(
        MOCK_REVERSE_RESPONSE.features[0].properties.context,
      );
      expect(mapbox.mapboxCalls().length).toBe(1);

      mapbox.fetchSpy.mockClear();

      // Second call from a nearby point that rounds to the same 5dp key —
      // should use the cache, no Mapbox API call
      const context2 = await mapboxReverseGeocode({
        lng: -0.409000004,
        lat: 52.996000004,
      });
      expect(context2).toEqual(context1);
      expect(mapbox.mapboxCalls().length).toBe(0);
    } finally {
      mapbox.restore();
      await db
        .deleteFrom("reverseGeocodeCache")
        .where("key", "=", key)
        .execute();
    }
  });

  test("expired cache entries are re-fetched", async () => {
    const point = { lng: -1.5, lat: 53.5 };
    const key = "-1.50000,53.50000";

    await db.deleteFrom("reverseGeocodeCache").where("key", "=", key).execute();

    // Insert a cache entry with a created_at older than 4 weeks
    await db
      .insertInto("reverseGeocodeCache")
      .values({ key, context: { place: { name: "Stale Town" } } })
      .execute();
    await db
      .updateTable("reverseGeocodeCache")
      .set({ createdAt: sql`now() - interval '5 weeks'` })
      .where("key", "=", key)
      .execute();

    const mapbox = mockMapboxFetch(MOCK_REVERSE_RESPONSE);
    try {
      const context = await mapboxReverseGeocode(point);

      // Should have called Mapbox because the cache entry was expired
      expect(mapbox.mapboxCalls().length).toBe(1);
      expect(context?.place?.name).toBe("Sleaford");

      // Verify the cache row was refreshed with the new context
      const cached = await db
        .selectFrom("reverseGeocodeCache")
        .select(["context", "createdAt"])
        .where("key", "=", key)
        .executeTakeFirst();
      expect(cached?.context?.place?.name).toBe("Sleaford");
    } finally {
      mapbox.restore();
      await db
        .deleteFrom("reverseGeocodeCache")
        .where("key", "=", key)
        .execute();
    }
  });
});

describe("real Mapbox API", () => {
  // Hits the live Mapbox geocoding API using MAPBOX_SECRET_TOKEN from
  // test_credentials.json. Validates that our parsing of real responses
  // works, not just the mocked shape. The address must not contain a
  // postcode, or geocoding would resolve via postcodes.io and skip Mapbox.
  test("enrichment resolves a Mapbox standard field via real forward and reverse geocoding", async () => {
    const address = "10 Downing Street, Westminster, London";
    const reversePoint = { lng: -0.1276, lat: 51.5034 };
    const reverseKey = "-0.12760,51.50340";

    await db
      .deleteFrom("geocodeCache")
      .where("address", "=", address)
      .execute();
    await db
      .deleteFrom("reverseGeocodeCache")
      .where("key", "=", reverseKey)
      .execute();

    const enrichment = {
      name: "Mapped: Town / city",
      sourceType: EnrichmentSourceType.Geocode as const,
      contextType: GeocodeContextType.Place,
    };

    try {
      // Forward: geocoding an address source record captures the context
      const geocodeResult = await geocodeRecord(
        { externalId: "real-mapbox-forward", json: { Address: address } },
        { type: GeocodingType.Address as const, columns: ["Address"] },
      );
      expect(geocodeResult).not.toBeNull();
      expect(geocodeResult?.geocodeContext).toBeTruthy();

      const forwardColumn = geocodeResult
        ? await getEnrichedColumn(
            { externalId: "real-mapbox-forward", json: {} },
            geocodeResult,
            enrichment,
          )
        : null;
      expect(forwardColumn?.value).toBe("London");

      // Reverse: a record geocoded without context (e.g. postcode or
      // coordinate sources) falls back to the reverse geocoding API
      const reverseColumn = await getEnrichedColumn(
        { externalId: "real-mapbox-reverse", json: {} },
        { areas: {}, centralPoint: reversePoint, samplePoint: reversePoint },
        enrichment,
      );
      expect(reverseColumn?.value).toBe("London");

      // The real reverse response is now cached for subsequent enrichments
      const cachedReverse = await db
        .selectFrom("reverseGeocodeCache")
        .select("context")
        .where("key", "=", reverseKey)
        .executeTakeFirst();
      expect(cachedReverse?.context?.place?.name).toBe("London");
    } finally {
      await db
        .deleteFrom("geocodeCache")
        .where("address", "=", address)
        .execute();
      await db
        .deleteFrom("reverseGeocodeCache")
        .where("key", "=", reverseKey)
        .execute();
    }
  });
});
