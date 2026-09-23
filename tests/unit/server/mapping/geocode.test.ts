import { describe, expect, test } from "vitest";
import { AreaSetCode } from "@/models/AreaSet";
import { GeocodingType } from "@/models/DataSource";
import { geocodeRecord } from "@/server/mapping/geocode";

describe("geocode", () => {
  test("geocodeRecord by address with multiple columns where one is blank and the other is a postcode", async () => {
    const dataRecord = {
      externalId: "test-1",
      json: {
        "Address Line 1": "",
        Postcode: "HP20 2QB",
      },
    };

    const geocodingConfig = {
      type: GeocodingType.Address as const,
      columns: ["Address Line 1", "Postcode"],
    };

    const result = await geocodeRecord(dataRecord, geocodingConfig);

    expect(result).not.toBeNull();
    expect(result?.centralPoint).not.toBeNull();
    expect(result?.samplePoint).not.toBeNull();
    expect(result?.centralPoint?.lat).toBeCloseTo(51.8, 0);
    expect(result?.centralPoint?.lng).toBeCloseTo(-0.8, 0);
    expect(result?.areas[AreaSetCode.PC]).toBe("HP20 2QB");
  });

  test("geocodeRecord by coordinates returns null for blank coordinates rather than 0,0", async () => {
    const geocodingConfig = {
      type: GeocodingType.Coordinates as const,
      latitudeColumn: "latitude",
      longitudeColumn: "longitude",
    };

    for (const [latitude, longitude] of [
      ["", ""],
      ["", "-1.5"],
      [null, null],
    ]) {
      const result = await geocodeRecord(
        { externalId: "test-blank", json: { latitude, longitude } },
        geocodingConfig,
      );
      expect(result).toBeNull();
    }
  });
});
