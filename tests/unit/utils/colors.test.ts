import { describe, expect, test } from "vitest";
import {
  colorWithAlpha,
  getContrastingRingColor,
  parseRgb,
} from "@/utils/colors";

describe("parseRgb", () => {
  test("parses 6-digit hex", () => {
    expect(parseRgb("#678DE3")).toEqual({ r: 103, g: 141, b: 227 });
  });

  test("parses 3-digit hex", () => {
    expect(parseRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  test("parses rgb()", () => {
    expect(parseRgb("rgb(1, 2, 3)")).toEqual({ r: 1, g: 2, b: 3 });
  });

  test("returns null for other formats", () => {
    expect(parseRgb("red")).toBeNull();
    expect(parseRgb("rgba(1, 2, 3, 0.5)")).toBeNull();
  });
});

describe("colorWithAlpha", () => {
  test("applies alpha to hex", () => {
    expect(colorWithAlpha("#ff6b6b", 0.5)).toBe("rgba(255, 107, 107, 0.5)");
  });

  test("returns null for unrecognised colours", () => {
    expect(colorWithAlpha("tomato", 0.5)).toBeNull();
  });
});

describe("getContrastingRingColor", () => {
  test("keeps the default marker colours unchanged", () => {
    expect(getContrastingRingColor("#678DE3")).toBe("#678DE3");
    expect(getContrastingRingColor("#FF6B6B")).toBe("#FF6B6B");
  });

  test("darkens pale colours until they read against white", () => {
    const ring = getContrastingRingColor("#ffff00");
    expect(ring).not.toBe("#ffff00");
    const rgb = parseRgb(ring);
    expect(rgb).not.toBeNull();
    // Hue preserved: still yellow (no blue channel)
    expect(rgb?.b).toBe(0);
    expect(rgb?.r).toBe(rgb?.g);
    // Noticeably darker than the input
    expect(rgb?.r).toBeLessThan(200);
  });

  test("darkens white to a grey", () => {
    const rgb = parseRgb(getContrastingRingColor("#ffffff"));
    expect(rgb?.r).toBeLessThan(200);
  });

  test("returns unparseable colours unchanged", () => {
    expect(getContrastingRingColor("hotpink")).toBe("hotpink");
  });
});
