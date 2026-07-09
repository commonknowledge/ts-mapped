import { describe, expect, test } from "vitest";
import { parseRangeString, sortColumnValues } from "@/utils/sortColumnValues";

describe("parseRangeString", () => {
  test("parses a simple range", () => {
    expect(parseRangeString("1-10")).toEqual({ start: 1, end: 10 });
  });

  test("parses a range with spaces and an en dash", () => {
    expect(parseRangeString("1,000 – 5,000")).toEqual({
      start: 1000,
      end: 5000,
    });
  });

  test("parses a plain number as a single-value range", () => {
    expect(parseRangeString("50")).toEqual({ start: 50, end: 50 });
  });

  test("parses decimal values", () => {
    expect(parseRangeString("0.5-1.5")).toEqual({ start: 0.5, end: 1.5 });
  });

  test("returns null for non-numeric values", () => {
    expect(parseRangeString("Unknown")).toBeNull();
    expect(parseRangeString("Low")).toBeNull();
    expect(parseRangeString("")).toBeNull();
  });

  test("returns null for values with trailing text", () => {
    expect(parseRangeString("10 Downing St")).toBeNull();
    expect(parseRangeString("1-10 people")).toBeNull();
  });

  test("returns null for malformed numbers", () => {
    expect(parseRangeString("1.2.3")).toBeNull();
  });
});

describe("sortColumnValues", () => {
  test("sorts range strings numerically, not alphabetically", () => {
    const values = ["1-10", "10-25", "1000-5000", "25-50", "50-100"];
    expect(sortColumnValues({ values })).toEqual([
      "1-10",
      "10-25",
      "25-50",
      "50-100",
      "1000-5000",
    ]);
  });

  test("sorts unparseable values after ranges, alphabetically", () => {
    const values = ["Unknown", "10-25", "1-10", "Another"];
    expect(sortColumnValues({ values })).toEqual([
      "1-10",
      "10-25",
      "Another",
      "Unknown",
    ]);
  });

  test("one dirty value does not collapse the ordering of the rest", () => {
    const values = ["50-100", "Unknown", "1-10", "10-25"];
    expect(sortColumnValues({ values })).toEqual([
      "1-10",
      "10-25",
      "50-100",
      "Unknown",
    ]);
  });

  test("sorts plain categorical values alphabetically", () => {
    const values = ["March", "Auditing", "Mural", "Demonstration"];
    expect(sortColumnValues({ values })).toEqual([
      "Auditing",
      "Demonstration",
      "March",
      "Mural",
    ]);
  });

  test("uses valueOrder metadata when set", () => {
    const values = ["Critical", "High", "Low", "Moderate"];
    const columnMetadata = {
      valueOrder: ["Low", "Moderate", "High", "Critical"],
    };
    expect(sortColumnValues({ values, columnMetadata })).toEqual([
      "Low",
      "Moderate",
      "High",
      "Critical",
    ]);
  });

  test("sorts values missing from valueOrder after ordered ones", () => {
    const values = ["Unknown", "High", "Low", "Extreme"];
    const columnMetadata = {
      valueOrder: ["Low", "Moderate", "High", "Critical"],
    };
    expect(sortColumnValues({ values, columnMetadata })).toEqual([
      "Low",
      "High",
      "Extreme",
      "Unknown",
    ]);
  });

  test("falls back to range parsing when valueOrder is empty", () => {
    const values = ["10-25", "1-10"];
    const columnMetadata = { valueOrder: [] };
    expect(sortColumnValues({ values, columnMetadata })).toEqual([
      "1-10",
      "10-25",
    ]);
  });

  test("does not mutate the input array", () => {
    const values = ["10-25", "1-10"];
    sortColumnValues({ values });
    expect(values).toEqual(["10-25", "1-10"]);
  });
});
