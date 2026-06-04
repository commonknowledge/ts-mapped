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
  let date = dataRecord.createdAt;
  const dateColumn =
    dataSourceConfig?.dateColumn || dataSource?.columnRoles.dateColumn;
  const dateFormat =
    dataSourceConfig?.dateFormat || dataSource?.dateFormat || "yyyy-MM-dd";
  if (dateColumn && dataRecord.json[dateColumn]) {
    const dateOverride = parse(
      String(dataRecord.json[dateColumn]),
      dateFormat,
      new Date(),
    );
    if (!isNaN(dateOverride.getTime())) {
      date = dateOverride;
    }
  }
  return date;
}

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
