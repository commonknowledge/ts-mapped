import { describe, expect, it } from "vitest";
import { formatStringColumn } from "@/app/(private)/map/[id]/publish/utils";

describe("formatStringColumn", () => {
  it("joins single-line values with commas", () => {
    expect(
      formatStringColumn({
        sourceColumns: ["a", "b", "c"],
        json: { a: "one", b: "", c: "three" },
      }),
    ).toBe("one, three");
  });

  it("joins values as paragraphs when any value is multi-line", () => {
    expect(
      formatStringColumn({
        sourceColumns: ["a", "b"],
        json: { a: "line one\nline two", b: "single" },
      }),
    ).toBe("line one\nline two\n\nsingle");
  });

  it("returns an empty string when there are no values", () => {
    expect(formatStringColumn({ sourceColumns: ["a"], json: {} })).toBe("");
  });
});
