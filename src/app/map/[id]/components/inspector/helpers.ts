import * as turf from "@turf/turf";
import type { SelectedTurf } from "@/app/map/[id]/types/inspector";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { MarkerFeature } from "@/types";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export const mapTurfToGeoFeature = (turf: SelectedTurf | null) => {
  if (!turf) {
    return null;
  }

  const geometry = turf?.geometry ?? null;
  if (!geometry) {
    return null;
  }

  return {
    type: "Feature",
    geometry: geometry,
  } as Feature<Polygon | MultiPolygon>;
};

const checkIfPointInPolygon = (
  coordinates: number[],
  polygon: Polygon | MultiPolygon,
) => {
  if (!coordinates?.[0] || !coordinates?.[1]) {
    return false;
  }

  const point = turf.point(coordinates);
  return turf.booleanPointInPolygon(point, polygon);
};

export function getMarkersInsidePolygon(
  markers: PlacedMarker[],
  polygon: Polygon | MultiPolygon | null | undefined,
) {
  if (!polygon) {
    return [];
  }

  return markers.filter((marker) => {
    return checkIfPointInPolygon([marker.point.lng, marker.point.lat], polygon);
  });
}

export function getMarkersInsideBoundary(
  markerQueriesData: { dataSourceId: string; markers: MarkerFeature[] }[],
  boundaryFeature: Polygon | MultiPolygon | null | undefined,
) {
  if (!boundaryFeature) {
    return [];
  }

  return markerQueriesData.map((d) => {
    return {
      dataSourceId: d.dataSourceId,
      markers: d.markers.filter((r) => {
        return checkIfPointInPolygon(r.geometry.coordinates, boundaryFeature);
      }),
    };
  });
}

export const groupPlacedMarkersByFolder = (
  placedMarkers: PlacedMarker[],
  folders: Folder[],
): { placedMarkers: PlacedMarker[]; folder: Folder | null }[] => {
  if (!placedMarkers.length) {
    return [];
  }

  const markersByFolderId = placedMarkers.reduce<
    Record<string, PlacedMarker[]>
  >((acc, marker) => {
    const key = marker.folderId || "no-folder";
    acc[key] = acc[key] || [];
    acc[key].push(marker);
    return acc;
  }, {});

  return Object.keys(markersByFolderId).map((folderId) => {
    const folder = folders.find((folder) => folder.id === folderId) ?? null;
    const markers = markersByFolderId[folderId] ?? [];

    return {
      folder: folder,
      placedMarkers: markers,
    };
  });
};
