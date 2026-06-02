import distance from "@turf/distance";
import { point } from "@turf/helpers";
import {
  buildPublicMapName,
  getListingSort,
  parseDate,
} from "@/utils/dataRecord";
import type { DataRecord } from "@/models/DataRecord";
import type { DataSource } from "@/models/DataSource";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";

// Re-exported from the shared (server-safe) util so existing consumers
// importing from "../utils" keep working.
export { buildPublicMapName };

// Sort records for a public map listing according to the data source config's
// `sortBy` / `sortDirection`. Done client-side because:
// - the name sort must use the public map config's name columns (via
//   buildPublicMapName), not the data source's own columnRoles.nameColumns
// - the date sort must parse configurable date formats (via parseDate), which
//   a lexical JSON column sort cannot do correctly.
export const sortRecordsForListing = ({
  records,
  dataSource,
  dataSourceConfig,
}: {
  records: DataRecord[];
  dataSource: DataSource | null | undefined;
  dataSourceConfig: PublicMapDataSourceConfig | null | undefined;
}): DataRecord[] => {
  const { sortBy, sortDirection } = getListingSort({
    dataSource,
    dataSourceConfig,
  });
  const sign = sortDirection === "desc" ? -1 : 1;

  if (sortBy === "date") {
    return records.toSorted((a, b) => {
      const aDate = parseDate({ dataSource, dataRecord: a, dataSourceConfig });
      const bDate = parseDate({ dataSource, dataRecord: b, dataSourceConfig });
      return sign * (aDate.getTime() - bDate.getTime());
    });
  }

  return records.toSorted((a, b) => {
    const aName = buildPublicMapName(dataSourceConfig, a);
    const bName = buildPublicMapName(dataSourceConfig, b);
    return sign * aName.localeCompare(bName);
  });
};

// TODO: make this configurable in public map config
const UNKNOWN_VALUES = ["Unknown", "I didn't ask", "Not applicable"];

export interface RecordGroup {
  name: string;
  geocodePoint: { lat: number; lng: number } | null;
  children: DataRecord[];
}

export const toBoolean = (val: unknown): boolean => {
  if (!val) {
    return false;
  }
  if (["false", "0", "no"].includes(String(val).toLowerCase())) {
    return false;
  }
  return Boolean(val);
};

export const toBooleanOrUnknown = (
  val: unknown,
  useUnknownValues = true,
): boolean | null => {
  if (
    useUnknownValues &&
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
