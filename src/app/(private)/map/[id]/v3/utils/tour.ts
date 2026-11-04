import { DUMMY_COUNT_COLUMN } from "@/constants";
import type { TourSnapshot, TourStepId } from "../constants";

// The area data key is "source|column…": a source alone has no column yet
const hasTourColumn = (snapshot: TourSnapshot) =>
  snapshot.areaDataKey.includes("|");

/** Whether a step's action has been done, from how things were when it started */
export const isTourStepDone = ({
  stepId,
  start,
  now,
  peakHidden,
}: {
  stepId: TourStepId;
  start: TourSnapshot;
  now: TourSnapshot;
  /** The most layers hidden at once during the step */
  peakHidden: number;
}): boolean => {
  switch (stepId) {
    case "addMembers":
      return now.layerCount > start.layerCount;
    case "customMarker":
      return now.customMarkerCount > start.customMarkerCount;
    case "addAreaData":
      return (
        Boolean(now.areaDataSourceId) &&
        now.areaDataSourceId !== start.areaDataSourceId
      );
    // A column actually chosen, not just a blank one added
    case "chooseColumn":
    case "pickColumn":
      return hasTourColumn(now) && now.areaDataKey !== start.areaDataKey;
    case "showOnMap":
      return Boolean(now.areaDataKey) && now.areaDataKey !== start.areaDataKey;
    // Hidden, then shown again
    case "toggleLayer":
      return (
        peakHidden > start.hiddenLayerCount &&
        now.hiddenLayerCount <= start.hiddenLayerCount
      );
    case "changeBoundaries":
      return (
        now.areaSetGroupCode !== start.areaSetGroupCode ||
        now.boundariesLocked !== start.boundariesLocked
      );
    case "clickArea":
      return Boolean(now.boundaryCode);
    case "markersTab":
      return now.inspectorTab === "markers";
    // A view added, then back to the first one
    case "marginalSeats":
      return now.listAreaCount > start.listAreaCount;
    case "yourList":
      return Boolean(now.inspectedListId);
    // A marker layer's record count now colours the map
    case "membersVisualisation":
      return (
        now.areaDataSourceId !== start.areaDataSourceId &&
        now.areaDataKey.endsWith(`|${DUMMY_COUNT_COLUMN}`)
      );
    case "views":
      return now.viewCount > start.viewCount && now.viewId === start.viewId;
    default:
      return false;
  }
};

/**
 * The middle of the densest cluster of points: the one with the most
 * neighbours within `radius` degrees, averaged with them. For flying the
 * map to where most members live.
 */
export const findDensestCluster = ({
  points,
  radius = 0.08,
}: {
  points: [number, number][];
  radius?: number;
}): [number, number] | null => {
  let best: [number, number][] = [];
  for (const [lng, lat] of points) {
    const near = points.filter(
      ([otherLng, otherLat]) =>
        Math.abs(otherLng - lng) <= radius &&
        Math.abs(otherLat - lat) <= radius,
    );
    if (near.length > best.length) best = near;
  }
  if (!best.length) return null;
  const sum = best.reduce(
    ([sumLng, sumLat], [lng, lat]) => [sumLng + lng, sumLat + lat],
    [0, 0],
  );
  return [sum[0] / best.length, sum[1] / best.length];
};
