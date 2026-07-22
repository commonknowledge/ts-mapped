import { describe, expect, test } from "vitest";
import { getOrderedSizeFactors } from "@/app/(private)/map/[id]/components/Markers/markerStyle";

const factorOf = (
  factors: { value: string; factor: number }[],
  value: string,
) => factors.find((f) => f.value === value)?.factor;

describe("getOrderedSizeFactors", () => {
  test("ramps range values smallest to largest", () => {
    const factors = getOrderedSizeFactors({
      values: ["100-200", "1-10", "1000-5000"],
      columnMetadata: undefined,
      descending: false,
    });
    expect(factorOf(factors, "1-10")).toBeLessThan(
      factorOf(factors, "100-200") ?? 0,
    );
    expect(factorOf(factors, "100-200")).toBeLessThan(
      factorOf(factors, "1000-5000") ?? 0,
    );
  });

  test("descending flips the ramp", () => {
    const factors = getOrderedSizeFactors({
      values: ["1-10", "1000-5000"],
      columnMetadata: undefined,
      descending: true,
    });
    expect(factorOf(factors, "1-10")).toBeGreaterThan(
      factorOf(factors, "1000-5000") ?? 0,
    );
  });

  test("unparseable values on range columns get the smallest size", () => {
    const factors = getOrderedSizeFactors({
      values: ["N/A", "1-10", "1000-5000"],
      columnMetadata: undefined,
      descending: false,
    });
    const min = Math.min(...factors.map((f) => f.factor));
    expect(factorOf(factors, "N/A")).toBe(min);
    // ...even when the ramp is descending
    const descendingFactors = getOrderedSizeFactors({
      values: ["N/A", "1-10", "1000-5000"],
      columnMetadata: undefined,
      descending: true,
    });
    expect(factorOf(descendingFactors, "N/A")).toBe(min);
    expect(factorOf(descendingFactors, "1000-5000")).toBe(min);
    expect(factorOf(descendingFactors, "1-10")).toBe(
      Math.max(...descendingFactors.map((f) => f.factor)),
    );
  });

  test("explicit valueOrder keeps unparseable values on the ramp", () => {
    const factors = getOrderedSizeFactors({
      values: ["N/A", "1-10", "1000-5000"],
      columnMetadata: {
        name: "col",
        description: "",
        valueLabels: {},
        valueOrder: ["1-10", "1000-5000", "N/A"],
      },
      descending: false,
    });
    expect(factorOf(factors, "N/A")).toBe(
      Math.max(...factors.map((f) => f.factor)),
    );
  });

  test("columns where nothing parses ramp every value", () => {
    const factors = getOrderedSizeFactors({
      values: ["High", "Low", "Moderate"],
      columnMetadata: undefined,
      descending: false,
    });
    const min = Math.min(...factors.map((f) => f.factor));
    const max = Math.max(...factors.map((f) => f.factor));
    expect(min).toBeLessThan(max);
    expect(factors).toHaveLength(3);
  });
});
