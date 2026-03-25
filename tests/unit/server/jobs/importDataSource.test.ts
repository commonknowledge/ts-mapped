import { describe, expect, test } from "vitest";

import { ColumnSemanticType } from "@/models/DataSource";
import {
  inferSemanticTypeFromRange,
  isPercentageColumnName,
} from "@/server/jobs/importDataSource";

describe("isPercentageColumnName", () => {
  test.each([
    ["pct_share", true],
    ["turnout_pct", true],
    ["PCT_VOTES", true],
    ["lab_percent", true],
    ["Lab %", true],
    ["Con %", true],
    ["electorate", false],
    ["turnout", false],
    ["count", false],
    ["Name", false],
  ])("%s → %s", (name, expected) => {
    expect(isPercentageColumnName(name)).toBe(expected);
  });
});

describe("inferSemanticTypeFromRange", () => {
  describe("name-based (nameBased=true)", () => {
    test("max = null → null", () => {
      expect(inferSemanticTypeFromRange(true, 0, null, false)).toBeNull();
    });

    test("max = 0 → Percentage01", () => {
      expect(inferSemanticTypeFromRange(true, 0, 0, false)).toBe(
        ColumnSemanticType.Percentage01,
      );
    });

    test("max = 0.5 → Percentage01", () => {
      expect(inferSemanticTypeFromRange(true, 0, 0.5, false)).toBe(
        ColumnSemanticType.Percentage01,
      );
    });

    test("max = 1 → Percentage01", () => {
      expect(inferSemanticTypeFromRange(true, 0, 1, false)).toBe(
        ColumnSemanticType.Percentage01,
      );
    });

    test("max = 1.5 → Percentage0100", () => {
      expect(inferSemanticTypeFromRange(true, 0, 1.5, false)).toBe(
        ColumnSemanticType.Percentage0100,
      );
    });

    test("max = 50 → Percentage0100", () => {
      expect(inferSemanticTypeFromRange(true, 0, 50, false)).toBe(
        ColumnSemanticType.Percentage0100,
      );
    });

    test("max = 100 → Percentage0100", () => {
      expect(inferSemanticTypeFromRange(true, 0, 100, false)).toBe(
        ColumnSemanticType.Percentage0100,
      );
    });

    test("max = 101 → null", () => {
      expect(inferSemanticTypeFromRange(true, 0, 101, false)).toBeNull();
    });
  });

  describe("value-range (nameBased=false)", () => {
    test("min=0, max=0.5, hasDecimals=true → Percentage01", () => {
      expect(inferSemanticTypeFromRange(false, 0, 0.5, true)).toBe(
        ColumnSemanticType.Percentage01,
      );
    });

    test("min=0, max=1, hasDecimals=true → Percentage01", () => {
      expect(inferSemanticTypeFromRange(false, 0, 1, true)).toBe(
        ColumnSemanticType.Percentage01,
      );
    });

    test("min=0, max=1, hasDecimals=false → null (all 0s and 1s)", () => {
      expect(inferSemanticTypeFromRange(false, 0, 1, false)).toBeNull();
    });

    test("min=0, max=0, hasDecimals=false → null (all zeros)", () => {
      expect(inferSemanticTypeFromRange(false, 0, 0, false)).toBeNull();
    });

    test("min=null, max=0.5, hasDecimals=true → null", () => {
      expect(inferSemanticTypeFromRange(false, null, 0.5, true)).toBeNull();
    });

    test("min=-0.5, max=0.5, hasDecimals=true → null (negative min)", () => {
      expect(inferSemanticTypeFromRange(false, -0.5, 0.5, true)).toBeNull();
    });

    test("min=0, max=2, hasDecimals=true → null (max > 1)", () => {
      expect(inferSemanticTypeFromRange(false, 0, 2, true)).toBeNull();
    });

    test("min=0, max=null → null", () => {
      expect(inferSemanticTypeFromRange(false, 0, null, true)).toBeNull();
    });
  });
});
