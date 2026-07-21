import { format, parse } from "date-fns";
import { DataSourceRecordType } from "@/models/DataSource";
import type { DataSource } from "@/models/DataSource";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";

// Resolve the effective listing sort for a public map data source, applying
// defaults when the config hasn't set them explicitly. Events data sources
// default to chronological order (date, ascending); everything else defaults
// to name (ascending), or newest-first when sorting by date.
export const getListingSort = ({
  dataSource,
  dataSourceConfig,
}: {
  dataSource: { recordType?: DataSourceRecordType } | null | undefined;
  dataSourceConfig:
    | Pick<PublicMapDataSourceConfig, "sortBy" | "sortDirection">
    | null
    | undefined;
}): { sortBy: "name" | "date"; sortDirection: "asc" | "desc" } => {
  const isEvents = dataSource?.recordType === DataSourceRecordType.Events;
  const sortBy = dataSourceConfig?.sortBy ?? (isEvents ? "date" : "name");
  const sortDirection =
    dataSourceConfig?.sortDirection ??
    (sortBy === "date" && !isEvents ? "desc" : "asc");
  return { sortBy, sortDirection };
};

export function buildName(
  dataSource: DataSource | null | undefined,
  dataRecord: { externalId: string; json: Record<string, unknown> },
) {
  const nameColumns = dataSource?.columnRoles.nameColumns || [];
  const name = nameColumns
    .map((c) => String(dataRecord.json[c] || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || `ID: ${dataRecord.externalId}`;
}

export const buildPublicMapName = (
  dataSourceConfig: PublicMapDataSourceConfig | null | undefined,
  record: { json: Record<string, unknown> },
) => {
  if (!dataSourceConfig) {
    return "Unknown";
  }
  const nameColumns = dataSourceConfig.nameColumns;
  const name = nameColumns
    .map((c) => String(record.json[c] || "").trim())
    .filter(Boolean)
    .join(" ");
  if (name) {
    return name;
  }
  const description = String(
    record.json[dataSourceConfig?.descriptionColumn || ""] || "",
  );
  return description || "Unknown";
};

// Matches ISO 8601 datetimes, e.g. "2026-05-13T22:00:00.000Z" as returned by
// the Airtable API. Datetime strings that don't match this are never passed to
// the native Date parser, which would guess at ambiguous formats (US-style).
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T/;

/**
 * Parse a date from a column value: the data source's dateFormat first,
 * then strict ISO datetimes. Null when the value is empty or doesn't parse.
 */
export function parseDateValue(
  value: unknown,
  dateFormat: string | null | undefined,
): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const str = String(value);
  const parsed = parse(str, dateFormat || "yyyy-MM-dd", new Date());
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  if (ISO_DATETIME_REGEX.test(str)) {
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }
  return null;
}

/**
 * Parse a record's date from its date column value. Null when there is no
 * date column, the value is empty, or it doesn't parse. This is the parser
 * used to store `dataRecord.date` at import time.
 */
export function parseRecordDate({
  json,
  dateColumn,
  dateFormat,
}: {
  json: Record<string, unknown>;
  dateColumn: string | null | undefined;
  dateFormat: string | null | undefined;
}): Date | null {
  if (!dateColumn) {
    return null;
  }
  return parseDateValue(json[dateColumn], dateFormat);
}

export function parseDate({
  dataSource,
  dataRecord,
  dataSourceConfig,
}: {
  dataSource: DataSource | null | undefined;
  dataRecord: { createdAt: Date; json: Record<string, unknown> };
  // Public map config that overrides the data source's date column/format when set.
  dataSourceConfig?: { dateColumn?: string; dateFormat?: string } | null;
}) {
  const date = parseRecordDate({
    json: dataRecord.json,
    dateColumn:
      dataSourceConfig?.dateColumn || dataSource?.columnRoles.dateColumn,
    dateFormat: dataSourceConfig?.dateFormat || dataSource?.dateFormat,
  });
  return date ?? dataRecord.createdAt;
}

/** Integer month key (year * 12 + zero-based month) used by the map
 *  timeline, so range comparisons are simple arithmetic. */
export const toMonthKey = (year: number, monthIndex: number): number =>
  year * 12 + monthIndex;

/** Convert an inclusive month-key range to date bounds for querying
 *  `dataRecord.date`: [from, to) with an exclusive upper bound. */
export const monthKeyRangeToDates = ({
  start,
  end,
}: {
  start: number;
  end: number;
}): { from: Date; to: Date } => ({
  from: new Date(Math.floor(start / 12), start % 12, 1),
  to: new Date(Math.floor(end / 12), (end % 12) + 1, 1),
});

// Human-readable display format for record dates, shared by the listing,
// the record detail sidebar and the marker popup.
export const RECORD_DATE_DISPLAY_FORMAT = "d MMMM yyyy";

export function formatRecordDate(input: {
  dataSource: DataSource | null | undefined;
  dataRecord: { createdAt: Date; json: Record<string, unknown> };
  dataSourceConfig?: { dateColumn?: string; dateFormat?: string } | null;
}): string {
  return format(parseDate(input), RECORD_DATE_DISPLAY_FORMAT);
}
