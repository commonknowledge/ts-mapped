import * as turf from "@turf/distance";
import { point } from "@turf/helpers";
import type { DataRecord } from "@/server/models/DataRecord";
import type { PublicMapDataSourceConfig } from "@/server/models/PublicMap";

export interface RecordGroup {
  id: string;
  name: string;
  geocodePoint: { lat: number; lng: number } | null;
  children: DataRecord[];
}

export const buildName = (
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
    const name = buildName(dataSourceConfig, r);
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
      if (group) {
        group.children.push(record);
        updateRecordGroupGeocodePoint(group, record);
      } else {
        groups.push({
          id: `${name}:${record.geocodePoint?.lng}:${record.geocodePoint?.lat}`,
          name,
          geocodePoint: record.geocodePoint,
          children: [record],
        });
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
  const d = turf.distance(from, to, { units: "meters" });

  return d <= metres;
};

// Update group.geocodePoint to be record.geocodePoint if
// record.geocodePoint < group.geocodePoint.
// This ensures consistent geocodePoint values for groups,
// regardless of the order of the child records.
// Also updates the group id.
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
    group.id = `${group.name}:${group.geocodePoint?.lng}:${group.geocodePoint?.lat}`;
  }
};
