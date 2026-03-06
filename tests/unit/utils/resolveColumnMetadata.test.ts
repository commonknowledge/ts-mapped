import { describe, expect, test } from "vitest";
import {
  resolveColumnMetadata,
  resolveColumnMetadataEntry,
} from "@/utils/resolveColumnMetadata";
import type { ColumnMetadata } from "@/server/models/DataSource";

const base: ColumnMetadata[] = [
  { name: "age", description: "Age of person", valueLabels: {} },
  {
    name: "status",
    description: "Current status",
    valueLabels: { "1": "Active", "2": "Inactive" },
  },
  { name: "region", description: "Geographic region", valueLabels: {} },
];

describe("resolveColumnMetadata", () => {
  test("returns base metadata when overrideMetadata is null", () => {
    expect(resolveColumnMetadata(base, null)).toEqual(base);
  });

  test("returns base metadata when overrideMetadata is undefined", () => {
    expect(resolveColumnMetadata(base, undefined)).toEqual(base);
  });

  test("returns base metadata when overrideMetadata is empty", () => {
    expect(resolveColumnMetadata(base, [])).toEqual(base);
  });

  test("overrides description when override provides one", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "Overridden age desc", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result.find((m) => m.name === "age")?.description).toBe(
      "Overridden age desc",
    );
  });

  test("keeps base description when override description is empty", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result.find((m) => m.name === "age")?.description).toBe(
      "Age of person",
    );
  });

  test("merges valueLabels from override on top of base", () => {
    const overrides: ColumnMetadata[] = [
      {
        name: "status",
        description: "",
        valueLabels: { "2": "Disabled", "3": "Pending" },
      },
    ];
    const result = resolveColumnMetadata(base, overrides);
    const status = result.find((m) => m.name === "status");
    expect(status?.valueLabels).toEqual({
      "1": "Active",
      "2": "Disabled",
      "3": "Pending",
    });
  });

  test("keeps base valueLabels when override valueLabels is empty", () => {
    const overrides: ColumnMetadata[] = [
      { name: "status", description: "New desc", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    const status = result.find((m) => m.name === "status");
    expect(status?.valueLabels).toEqual({ "1": "Active", "2": "Inactive" });
  });

  test("leaves unmatched base columns untouched", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "Override", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result.find((m) => m.name === "region")).toEqual(base[2]);
    expect(result.find((m) => m.name === "status")).toEqual(base[1]);
  });

  test("ignores overrides that don't match any base column", () => {
    const overrides: ColumnMetadata[] = [
      { name: "nonexistent", description: "Ghost", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result).toEqual(base);
  });

  test("preserves base column order", () => {
    const overrides: ColumnMetadata[] = [
      { name: "region", description: "Overridden region", valueLabels: {} },
      { name: "age", description: "Overridden age", valueLabels: {} },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result.map((m) => m.name)).toEqual(["age", "status", "region"]);
  });

  test("handles overriding all columns at once", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "A", valueLabels: { x: "X" } },
      { name: "status", description: "B", valueLabels: { "1": "On" } },
      { name: "region", description: "C", valueLabels: { r: "R" } },
    ];
    const result = resolveColumnMetadata(base, overrides);
    expect(result).toEqual([
      { name: "age", description: "A", valueLabels: { x: "X" } },
      {
        name: "status",
        description: "B",
        valueLabels: { "1": "On", "2": "Inactive" },
      },
      { name: "region", description: "C", valueLabels: { r: "R" } },
    ]);
  });

  test("returns empty array when base is empty", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "Override", valueLabels: {} },
    ];
    expect(resolveColumnMetadata([], overrides)).toEqual([]);
  });
});

describe("resolveColumnMetadataEntry", () => {
  test("returns resolved entry for a matching column", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "Overridden", valueLabels: {} },
    ];
    const entry = resolveColumnMetadataEntry(base, overrides, "age");
    expect(entry).toEqual({
      name: "age",
      description: "Overridden",
      valueLabels: {},
    });
  });

  test("returns base entry when no override exists for column", () => {
    const overrides: ColumnMetadata[] = [
      { name: "age", description: "Overridden", valueLabels: {} },
    ];
    const entry = resolveColumnMetadataEntry(base, overrides, "status");
    expect(entry).toEqual(base[1]);
  });

  test("returns undefined when column does not exist in base", () => {
    const entry = resolveColumnMetadataEntry(base, null, "nonexistent");
    expect(entry).toBeUndefined();
  });

  test("works with null overrides", () => {
    const entry = resolveColumnMetadataEntry(base, null, "age");
    expect(entry).toEqual(base[0]);
  });

  test("works with undefined overrides", () => {
    const entry = resolveColumnMetadataEntry(base, undefined, "region");
    expect(entry).toEqual(base[2]);
  });
});
