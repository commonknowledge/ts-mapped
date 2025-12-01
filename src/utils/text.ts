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

export function buildName(
  dataSource: DataSource | null | undefined,
  dataRecord: { externalId: string; json: Record<string, unknown> },
) {
  const nameColumns = dataSource?.columnRoles.nameColumns || [];
  const name = nameColumns
    .map((c) => String(dataRecord.json[c]).trim())
    .filter(Boolean)
    .join(" ");
  return name || `ID: ${dataRecord.externalId}`;
}
