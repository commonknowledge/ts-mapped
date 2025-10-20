import * as turf from "@turf/turf";
import { CHOROPLETH_LAYER_CONFIGS } from "@/app/map/[id]/sources";
import { AreaSetCodeLabels } from "@/labels";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { RecordData, RecordsResponse } from "@/types";
import type { Feature, Polygon } from "geojson";

export function getMarkersInsidePolygon(
  markers: PlacedMarker[],
  geometry: Polygon | null | undefined,
) {
  if (!geometry) {
    return [];
  }

  const turfPolygon = turf.polygon(geometry.coordinates);

  return markers.filter((marker) => {
    const point = turf.point([marker.point.lng, marker.point.lat]);
    return turf.booleanPointInPolygon(point, turfPolygon);
  });
}

export function getRecordsInsideBoundary(
  data: {
    records: RecordsResponse;
    dataSource: DataSource | null;
  }[],
  boundaryFeature: Feature<Polygon> | null | undefined,
) {
  if (!boundaryFeature) {
    return [];
  }

  return data.map((d) => {
    const recordsInsideTurf = d.records.records.filter((r) => {
      const point = turf.point([r.geocodePoint.lng, r.geocodePoint.lat]);
      return turf.booleanPointInPolygon(
        point,
        boundaryFeature as Feature<Polygon>,
      );
    });

    return {
      dataSource: d.dataSource,
      records: {
        count: {
          ...d.records.count,
          matched: recordsInsideTurf?.length ?? 0,
        },
        records: recordsInsideTurf,
      },
    };
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

function findAreaSetCodeByLayerId(layerId: string): string | null {
  for (const [key, items] of Object.entries(CHOROPLETH_LAYER_CONFIGS)) {
    const found = items.some((item) => item.mapbox?.layerId === layerId);
    if (found) {
      return key;
    }
  }
  return null;
}

export const getBoundaryDatasetName = (
  sourceLayerId: string | null | undefined,
) => {
  if (!sourceLayerId) {
    return "";
  }

  const configName = findAreaSetCodeByLayerId(sourceLayerId);

  if (!configName) {
    return "Boundary Data";
  }

  return AreaSetCodeLabels?.[configName as AreaSetCode] ?? "Boundary Data";
};
