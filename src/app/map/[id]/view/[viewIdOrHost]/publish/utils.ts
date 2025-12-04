import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { DataRecord } from "@/server/models/DataRecord";
import type { PublicMapDataSourceConfig } from "@/server/models/PublicMap";

// TODO: make this configurable in public map config
const UNKNOWN_VALUES = ["Unknown", "I didn't ask", "Not applicable"];

export interface RecordGroup {
  name: string;
  geocodePoint: { lat: number; lng: number } | null;
  children: DataRecord[];
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

export const toBoolean = (val: unknown): boolean => {
  if (!val) {
    return false;
  }
  if (["false", "0", "no"].includes(String(val).toLowerCase())) {
    return false;
  }
  return Boolean(val);
};

export const toBooleanOrUnknown = (val: unknown): boolean | null => {
  if (
    UNKNOWN_VALUES.some((v) =>
      String(val).toLowerCase().startsWith(v.toLowerCase()),
    )
  ) {
    return null;
  }
  return toBoolean(val);
};

export function jsonToAirtablePrefill(data: Record<string, unknown>): string {
  const queryParams = Object.entries(data)
    .map(
      ([key, value]) =>
        `prefill_${encodeURIComponent(key)}=${encodeURIComponent(String(value || ""))}`,
    )
    .join("&");

  return `?${queryParams}`;
}

export const groupRecords = (
  dataSourceConfig: PublicMapDataSourceConfig | null | undefined,
  records: DataRecord[],
) => {
  const recordsByName: Record<string, DataRecord[]> = {};
  for (const r of records) {
    const name = buildPublicMapName(dataSourceConfig, r);
    if (recordsByName[name]?.length) {
      recordsByName[name].push(r);
    } else {
      recordsByName[name] = [r];
    }
  }

  let recordGroups: RecordGroup[] = [];
  for (const name of Object.keys(recordsByName)) {
    const children = recordsByName[name];
    const groups: RecordGroup[] = [];
    for (const record of children) {
      const group = groups.find((c) =>
        isWithin(c.geocodePoint, record.geocodePoint),
      );
      if (!group) {
        groups.push({
          name,
          geocodePoint: record.geocodePoint,
          children: [record],
        });
        continue;
      }
      const isDuplicate = group.children.some(
        (c) => JSON.stringify(c.json) === JSON.stringify(record.json),
      );
      if (!isDuplicate) {
        group.children.push(record);
        updateRecordGroupGeocodePoint(group, record);
      }
    }
    recordGroups = recordGroups.concat(groups);
  }
  return recordGroups;
};

export const isWithin = (
  point1: { lat: number; lng: number } | null,
  point2: { lat: number; lng: number } | null,
  metres = 200,
): boolean => {
  if (!point1 || !point2) {
    // Return true if both points are null
    return !point1 && !point2;
  }
  const from = point([point1.lng, point1.lat]);
  const to = point([point2.lng, point2.lat]);
  const d = distance(from, to, { units: "meters" });

  return d <= metres;
};

// Update group.geocodePoint to be record.geocodePoint if
// record.geocodePoint < group.geocodePoint.
// This ensures consistent geocodePoint values for groups,
// regardless of the order of the child records.
const updateRecordGroupGeocodePoint = (
  group: RecordGroup,
  record: DataRecord,
): void => {
  if (!record.geocodePoint) {
    return;
  }
  let shouldUpdate = false;
  if (!group.geocodePoint) {
    shouldUpdate = true;
  } else if (record.geocodePoint.lng < group.geocodePoint.lng) {
    shouldUpdate = true;
  } else if (
    record.geocodePoint.lng === group.geocodePoint.lng &&
    record.geocodePoint.lat < group.geocodePoint.lat
  ) {
    shouldUpdate = true;
  }
  if (shouldUpdate) {
    group.geocodePoint = record.geocodePoint;
  }
};
