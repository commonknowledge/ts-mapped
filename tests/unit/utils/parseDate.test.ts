import { describe, expect, it } from "vitest";
import { parseDate } from "@/utils/dataRecord";

const createdAt = new Date("2020-01-01T00:00:00.000Z");

const buildRecord = (value: unknown) => ({
  createdAt,
  json: { date: value },
});

const dataSourceConfig = { dateColumn: "date", dateFormat: "yyyy-MM-dd" };

describe("parseDate", () => {
  it("parses dates with the configured dateFormat", () => {
    const date = parseDate({
      dataSource: null,
      dataRecord: buildRecord("2023-06-15"),
      dataSourceConfig,
    });
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(15);
  });

  it("falls back to native parsing for ISO datetimes", () => {
    const date = parseDate({
      dataSource: null,
      dataRecord: buildRecord("2026-05-13T22:00:00.000Z"),
      dataSourceConfig,
    });
    expect(date.toISOString()).toBe("2026-05-13T22:00:00.000Z");
  });

  it("parses ISO datetimes even when the configured format is not ISO", () => {
    const date = parseDate({
      dataSource: null,
      dataRecord: buildRecord("2026-05-13T22:00:00.000Z"),
      dataSourceConfig: { dateColumn: "date", dateFormat: "dd/MM/yyyy" },
    });
    expect(date.toISOString()).toBe("2026-05-13T22:00:00.000Z");
  });

  it("does not pass ambiguous non-ISO strings to the native parser", () => {
    const date = parseDate({
      dataSource: null,
      dataRecord: buildRecord("05/06/2026"),
      dataSourceConfig,
    });
    expect(date).toBe(createdAt);
  });

  it("falls back to createdAt for unparseable values", () => {
    const date = parseDate({
      dataSource: null,
      dataRecord: buildRecord("not a date"),
      dataSourceConfig,
    });
    expect(date).toBe(createdAt);
  });
});
