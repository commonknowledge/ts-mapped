import mapStyles from "./styles";
import type { MapConfig } from "@/server/models/Map";
import type { MapViewConfig } from "@/server/models/MapView";

export const sortByPositionAndId = <T extends { id: string; position: number }>(
  items: T[],
) => {
  return items.toSorted(compareByPositionAndId);
};

export const compareByPositionAndId = (
  a: { id: string; position: number },
  b: { id: string; position: number },
) => {
  if (a.position === b.position) {
    return a.id < b.id ? -1 : 1;
  }
  return a.position < b.position ? -1 : 1;
};

export const getNewFirstPosition = (items: { position: number }[]) => {
  let first = 0;
  for (const item of items) {
    if (item.position < first) {
      first = item.position;
    }
  }
  return first - 1;
};

export const getNewLastPosition = (items: { position: number }[]) => {
  let last = 0;
  for (const item of items) {
    if (item.position > last) {
      last = item.position;
    }
  }
  return last + 1;
};

// Get a position that will be immediately before `from`
export const getNewPositionBefore = (
  from: number,
  items: { position: number }[],
) => {
  // Get the position just before `from`, if it exists
  let beforeFrom = null;
  for (const item of items) {
    if (item.position < from) {
      if (beforeFrom === null || item.position > beforeFrom) {
        beforeFrom = item.position;
      }
    }
  }
  // If `from` was already the first position
  if (beforeFrom === null) {
    return from - 1;
  }
  return (beforeFrom + from) / 2;
};

// Get a position that will be immediate after `from`
export const getNewPositionAfter = (
  from: number,
  items: { position: number }[],
) => {
  let afterFrom = null;
  for (const item of items) {
    if (item.position > from) {
      if (afterFrom === null || item.position < afterFrom) {
        afterFrom = item.position;
      }
    }
  }
  if (afterFrom === null) {
    return from + 1;
  }
  return (afterFrom + from) / 2;
};

export const getDataSourceIds = (mapConfig: MapConfig) => {
  return new Set(
    [mapConfig.membersDataSourceId]
      .concat(mapConfig.markerDataSourceIds)
      .filter(Boolean),
  )
    .values()
    .toArray();
};

export const getMapStyle = (viewConfig: MapViewConfig) => {
  return mapStyles[viewConfig.mapStyleName] || Object.values(mapStyles)[0];
};
