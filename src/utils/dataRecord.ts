import { parse } from "date-fns";
import type { DataSource } from "@/server/models/DataSource";

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

export function parseDate(
  dataSource: DataSource | null | undefined,
  dataRecord: { createdAt: Date; json: Record<string, unknown> },
) {
  let date = dataRecord.createdAt;
  const dateColumn = dataSource?.columnRoles.dateColumn;
  if (dateColumn && dataRecord.json[dateColumn]) {
    const dateOverride = parse(
      String(dataRecord.json[dateColumn]),
      dataSource.dateFormat || "yyyy-MM-dd",
      new Date(),
    );
    if (!isNaN(dateOverride.getTime())) {
      date = dateOverride;
    }
  }
  return date;
}
