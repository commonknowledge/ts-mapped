import { describe, expect, it } from "vitest";
import { parseRecordYear } from "@/utils/dataRecord";

describe("parseRecordYear", () => {
  it("uses plain 4-digit years directly", () => {
    expect(parseRecordYear({ value: "2026" })).toBe(2026);
    expect(parseRecordYear({ value: 2019 })).toBe(2019);
    expect(parseRecordYear({ value: " 1999 " })).toBe(1999);
  });

  it("parses dates with the data source dateFormat", () => {
    expect(
      parseRecordYear({ value: "31/12/2024", dateFormat: "dd/MM/yyyy" }),
    ).toBe(2024);
    expect(
      parseRecordYear({ value: "2023-06-15", dateFormat: "yyyy-MM-dd" }),
    ).toBe(2023);
  });

  it("falls back to native date parsing", () => {
    expect(parseRecordYear({ value: "2026-03-29T12:00:00.000Z" })).toBe(2026);
    expect(
      parseRecordYear({
        value: "2022-11-05",
        dateFormat: "dd/MM/yyyy",
      }),
    ).toBe(2022);
  });

  it("returns null for empty or unparseable values", () => {
    expect(parseRecordYear({ value: null })).toBeNull();
    expect(parseRecordYear({ value: undefined })).toBeNull();
    expect(parseRecordYear({ value: "" })).toBeNull();
    expect(parseRecordYear({ value: "   " })).toBeNull();
    expect(parseRecordYear({ value: "not a date" })).toBeNull();
    expect(parseRecordYear({ value: "12" })).toBeNull();
  });
});
