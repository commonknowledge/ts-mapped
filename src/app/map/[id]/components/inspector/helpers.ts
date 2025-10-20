import * as turf from "@turf/turf";
import type { SelectedTurf } from "@/app/map/[id]/context/InspectorContext";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { RecordData, RecordsResponse } from "@/types";

export function getMarkersInsideTurf(
  markers: PlacedMarker[],
  selectedTurf: SelectedTurf | null
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

export const checkIfAnyRecords = (markers: { records: RecordsResponse }[]) => {
  const allRecords = markers
    .flatMap((marker) => marker.records.records)
    .filter((r) => Boolean(r));

  return allRecords?.length > 0;
};

const placedMarkerToRecord = (marker: PlacedMarker): RecordData => {
  return {
    id: marker.id,
    geocodePoint: marker.point,
    json: {
      name: marker.label || "Placed marker",
      notes: marker.notes || "",
    },
  };
};

export const mapPlacedMarkersToRecordsResponse = (
  markers: PlacedMarker[],
  folders: Folder[]
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
    {}
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

export const getBoundaryDatasetName = (
  properties: Record<string, unknown> | null | undefined
) => {
  if (!properties) {
    return "";
  }

  const layerId = properties.layerId || "";
  const sourceLayer = properties.sourceLayer || "";
  const gssCode = properties.gss_code || "";

  if (
    (layerId as string).includes("uk_cons") ||
    (sourceLayer as string).includes("uk_cons") ||
    (sourceLayer as string).includes("uk_cons_2025") ||
    (gssCode as string).startsWith("E14")
  ) {
    return "Westminster Constituencies";
  }
  if (
    (layerId as string).includes("OA21") ||
    (sourceLayer as string).includes("OA21")
  )
    return "Output Areas";
  if (
    (layerId as string).includes("MSOA") ||
    (sourceLayer as string).includes("MSOA")
  )
    return "Middle Layer Super Output Areas";

  if ((gssCode as string).startsWith("E14"))
    return "Westminster Constituencies";

  return "Boundary Data";
};
