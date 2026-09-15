import * as turf from "@turf/turf";
import { describe, expect, test } from "vitest";

/**
 * @turf/turf functions used in src: area, bbox, center, circle and
 * booleanPointInPolygon (turf drawing and area calculations).
 */
describe("@turf/turf", () => {
  const square = turf.polygon([
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  ]);

  test("area, bbox, center", () => {
    expect(turf.area(square)).toBeGreaterThan(12_000_000_000);
    expect(turf.bbox(square)).toEqual([0, 0, 1, 1]);
    expect(turf.center(square).geometry.coordinates).toEqual([0.5, 0.5]);
  });

  test("circle and booleanPointInPolygon", () => {
    const c = turf.circle([0.5, 0.5], 10, { units: "kilometers" });
    expect(turf.booleanPointInPolygon(turf.point([0.5, 0.5]), c)).toBe(true);
    expect(turf.booleanPointInPolygon(turf.point([5, 5]), square)).toBe(false);
  });
});
