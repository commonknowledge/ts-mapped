import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  ColumnType,
  EnrichmentSourceType,
  GeocodeContextType,
} from "@/models/DataSource";
import type { GeocodeResult } from "@/models/DataRecord";

const mapboxReverseGeocode = vi.fn();

vi.mock("@/server/mapping/geocode", () => ({
  geocodeRecord: vi.fn(),
  mapboxReverseGeocode: (...args: unknown[]) => mapboxReverseGeocode(...args),
}));

const { getEnrichedColumn } = await import("@/server/mapping/enrich");

const record = { externalId: "r1", json: {} };
const point = { lat: 53.0, lng: -0.4 };

const geocodeEnrichment = {
  name: "Mapped: Town / city",
  sourceType: EnrichmentSourceType.Geocode as const,
  contextType: GeocodeContextType.Place,
};

describe("getEnrichedColumn — Geocode", () => {
  beforeEach(() => {
    mapboxReverseGeocode.mockReset();
  });

  test("uses forward-captured context without reverse geocoding", async () => {
    const geocodeResult: GeocodeResult = {
      areas: {},
      centralPoint: point,
      samplePoint: point,
      geocodeContext: {
        place: { name: "London" },
        region: { name: "England" },
      },
    };

    const result = await getEnrichedColumn(
      record,
      geocodeResult,
      geocodeEnrichment,
    );

    expect(result?.value).toBe("London");
    expect(result?.def.type).toBe(ColumnType.String);
    expect(mapboxReverseGeocode).not.toHaveBeenCalled();
  });

  test("reverse geocodes from the point when no context was captured", async () => {
    mapboxReverseGeocode.mockResolvedValue({ place: { name: "Sleaford" } });
    const geocodeResult: GeocodeResult = {
      areas: { PC: "NG34 7SS" },
      centralPoint: point,
      samplePoint: point,
    };

    const result = await getEnrichedColumn(
      record,
      geocodeResult,
      geocodeEnrichment,
    );

    expect(mapboxReverseGeocode).toHaveBeenCalledWith(point);
    expect(result?.value).toBe("Sleaford");
  });

  test("returns null when the requested context layer is absent", async () => {
    mapboxReverseGeocode.mockResolvedValue({ region: { name: "England" } });
    const geocodeResult: GeocodeResult = {
      areas: {},
      centralPoint: point,
      samplePoint: point,
    };

    const result = await getEnrichedColumn(
      record,
      geocodeResult,
      geocodeEnrichment,
    );

    expect(result?.value).toBeNull();
  });
});
