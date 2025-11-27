import type { DataSource } from "@/server/models/DataSource";

export const trimLeadingSlashes = (str: string) => str.replace(/^\/+/g, "");
export const trimTrailingSlashes = (str: string) => str.replace(/\/+$/g, "");

export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "";
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDataRecordName(
  record: { externalId: string; json: Record<string, unknown> },
  dataSource: DataSource | null | undefined,
) {
  const nameColumns = dataSource?.columnRoles.nameColumns || [];
  const names = nameColumns.map((c) => record.json[c]).filter(Boolean);
  return names.length ? names.join(" ") : `ID: ${record.externalId}`;
}
