import * as turf from "@turf/turf";
import type { SelectedTurf } from "@/app/map/[id]/context/InspectorContext";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { RecordData, RecordsResponse } from "@/types";

export function getMarkersInsideTurf(
  markers: PlacedMarker[],
  selectedTurf: SelectedTurf | null,
) {
  if (!selectedTurf) {
    return [];
  }

  const turfPolygon = turf.polygon(selectedTurf.geometry.coordinates);

  return markers.filter((marker) => {
    const point = turf.point([marker.point.lng, marker.point.lat]);
    return turf.booleanPointInPolygon(point, turfPolygon);
  });
}

const placedMarkerToRecord = (marker: PlacedMarker): RecordData => {
  return {
    id: marker.id,
    json: {
      name: marker.label || "Placed marker",
      notes: marker.notes || "",
    },
  };
};

export const mapPlacedMarkersToRecordsResponse = (
  markers: PlacedMarker[],
  folders: Folder[],
): { records: RecordsResponse; folder: Folder | null }[] => {
  if (!markers?.length) {
    return [];
  }

  const markersByFolderId = markers.reduce<Record<string, PlacedMarker[]>>(
    (acc, marker) => {
      const key = marker.folderId || "no-folder";
      acc[key] = acc[key] || [];
      acc[key].push(marker);
      return acc;
    },
    {},
  );

  return Object.keys(markersByFolderId).map((folderId) => {
    const folder = folders.find((folder) => folder.id === folderId) ?? null;
    const markers = markersByFolderId[folderId] ?? [];

    return {
      folder: folder,
      records: {
        count: { matched: markers.length },
        records: markers.map((marker) => placedMarkerToRecord(marker)),
      },
    };
  });
};
