import { describe, expect, it } from "vitest";
import { parseRecordDate } from "@/utils/dataRecord";

describe("parseRecordDate", () => {
  it("parses dates with the data source dateFormat", () => {
    expect(
      parseRecordDate({
        json: { Date: "31/12/2024" },
        dateColumn: "Date",
        dateFormat: "dd/MM/yyyy",
      }),
    ).toEqual(new Date(2024, 11, 31));
    expect(
      parseRecordDate({
        json: { Date: "2023-06-15" },
        dateColumn: "Date",
        dateFormat: "yyyy-MM-dd",
      }),
    ).toEqual(new Date(2023, 5, 15));
  });

  it("defaults to yyyy-MM-dd when no format is set", () => {
    expect(
      parseRecordDate({
        json: { Date: "2023-06-15" },
        dateColumn: "Date",
        dateFormat: null,
      }),
    ).toEqual(new Date(2023, 5, 15));
  });

  it("supports year-only columns via a yyyy format", () => {
    expect(
      parseRecordDate({
        json: { Year: "2026" },
        dateColumn: "Year",
        dateFormat: "yyyy",
      }),
    ).toEqual(new Date(2026, 0, 1));
  });

  it("falls back to strict ISO datetimes only", () => {
    expect(
      parseRecordDate({
        json: { Date: "2026-03-29T12:00:00.000Z" },
        dateColumn: "Date",
        dateFormat: "dd/MM/yyyy",
      }),
    ).toEqual(new Date("2026-03-29T12:00:00.000Z"));
    // Ambiguous non-ISO strings never hit the native parser
    expect(
      parseRecordDate({
        json: { Date: "03/04/2026" },
        dateColumn: "Date",
        dateFormat: "yyyy",
      }),
    ).toBeNull();
  });

  it("returns null for missing columns and unparseable values", () => {
    expect(
      parseRecordDate({ json: {}, dateColumn: "Date", dateFormat: null }),
    ).toBeNull();
    expect(
      parseRecordDate({
        json: { Date: "not a date" },
        dateColumn: "Date",
        dateFormat: "yyyy-MM-dd",
      }),
    ).toBeNull();
    expect(
      parseRecordDate({
        json: { Date: "2026" },
        dateColumn: null,
        dateFormat: null,
      }),
    ).toBeNull();
  });
});
