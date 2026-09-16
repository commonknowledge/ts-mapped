import { describe, expect, it } from "vitest";
import {
  PAST_EVENTS_FILTER_KEY,
  getDateFilterRange,
} from "@/app/(private)/map/[id]/publish/dateFilters";
import { DataSourceRecordType } from "@/models/DataSource";
import {
  getEventDate,
  getHidePastEvents,
  getPastEventsCutoff,
  isPastEvent,
} from "@/utils/dataRecord";

const dataSourceConfig = { dateColumn: "date", dateFormat: "yyyy-MM-dd" };

describe("getHidePastEvents", () => {
  it("defaults to on for Events data sources", () => {
    expect(
      getHidePastEvents({
        dataSource: { recordType: DataSourceRecordType.Events },
        dataSourceConfig: {},
      }),
    ).toBe(true);
  });

  it("defaults to off for other record types", () => {
    expect(
      getHidePastEvents({
        dataSource: { recordType: DataSourceRecordType.Locations },
        dataSourceConfig: {},
      }),
    ).toBe(false);
    expect(
      getHidePastEvents({ dataSource: null, dataSourceConfig: null }),
    ).toBe(false);
  });

  it("an explicit config value wins over the record type default", () => {
    expect(
      getHidePastEvents({
        dataSource: { recordType: DataSourceRecordType.Events },
        dataSourceConfig: { hidePastEvents: false },
      }),
    ).toBe(false);
    expect(
      getHidePastEvents({
        dataSource: { recordType: DataSourceRecordType.Locations },
        dataSourceConfig: { hidePastEvents: true },
      }),
    ).toBe(true);
  });
});

describe("getEventDate", () => {
  it("returns null for undated records instead of falling back", () => {
    expect(
      getEventDate({
        dataSource: null,
        dataRecord: { json: {} },
        dataSourceConfig,
      }),
    ).toBeNull();
    expect(
      getEventDate({
        dataSource: null,
        dataRecord: { json: { date: "not a date" } },
        dataSourceConfig,
      }),
    ).toBeNull();
  });

  it("parses the public map's overridden date column", () => {
    const date = getEventDate({
      dataSource: null,
      dataRecord: { json: { date: "2026-09-20" } },
      dataSourceConfig,
    });
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(8);
    expect(date?.getDate()).toBe(20);
  });
});

describe("past events cutoff", () => {
  const now = new Date(2026, 8, 16, 15, 30); // 16 Sep 2026, 15:30 local
  const cutoff = getPastEventsCutoff(now);

  it("is the start of today, so events earlier today are still upcoming", () => {
    expect(cutoff.getTime()).toBe(new Date(2026, 8, 16).getTime());
    expect(isPastEvent(new Date(2026, 8, 16, 9, 0), cutoff)).toBe(false);
    expect(isPastEvent(new Date(2026, 8, 15, 23, 59), cutoff)).toBe(true);
    expect(isPastEvent(new Date(2026, 8, 17), cutoff)).toBe(false);
  });

  it("never treats an undated record as past", () => {
    expect(isPastEvent(null, cutoff)).toBe(false);
  });

  it("the Past events quick filter ends where the cutoff begins", () => {
    const { start, end } = getDateFilterRange(PAST_EVENTS_FILTER_KEY);
    const today = getPastEventsCutoff();
    expect(start.getTime()).toBe(0);
    expect(end.getTime()).toBeLessThan(today.getTime());
    expect(today.getTime() - end.getTime()).toBeLessThanOrEqual(1);
  });
});
