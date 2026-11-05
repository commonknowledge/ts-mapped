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
  peakSelectedRecords,
}: {
  stepId: TourStepId;
  start: TourSnapshot;
  now: TourSnapshot;
  /** The most layers hidden at once during the step */
  peakHidden: number;
  /** The most marker records open at once during the step */
  peakSelectedRecords: number;
}): boolean => {
  switch (stepId) {
    case "addMembers":
      return now.layerCount > start.layerCount;
    case "addAreaData":
      return (
        Boolean(now.areaDataSourceId) &&
        now.areaDataSourceId !== start.areaDataSourceId
      );
    // A column actually chosen, not just a blank one added
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
      // Unlocked, then changed this visualisation's own boundaries
      return (
        !now.boundariesLocked && now.areaSetGroupCode !== start.areaSetGroupCode
      );
    case "clickArea":
      return Boolean(now.boundaryCode);
    case "markersTab":
      // Opened a member from the list, then came back to the area
      return (
        peakSelectedRecords > start.selectedRecordCount &&
        now.selectedRecordCount === 0 &&
        Boolean(now.boundaryCode)
      );
    case "dataSourceTab":
      // Back on an Areas data tab (not Markers / Notes)
      return Boolean(
        now.inspectorTab &&
        now.inspectorTab !== "markers" &&
        now.inspectorTab !== "notes" &&
        now.selectedRecordCount === 0,
      );
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
    // A second view added; stay on it for the next visualisation
    case "views":
      return now.viewCount > start.viewCount;
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
