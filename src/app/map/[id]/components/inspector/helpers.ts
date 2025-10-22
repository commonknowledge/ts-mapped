import * as turf from "@turf/turf";
import { CHOROPLETH_LAYER_CONFIGS } from "@/app/map/[id]/sources";
import { AreaSetCodeLabels } from "@/labels";
import type {
  SelectedBoundary,
  SelectedTurf,
} from "@/app/map/[id]/context/InspectorContext";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { PointFeature, RecordData, RecordsResponse } from "@/types";
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

export const mapBoundaryToGeoFeature = (boundary: SelectedBoundary | null) => {
  if (!boundary) {
    return null;
  }

  const feature = boundary?.boundaryFeature ?? null;
  if (!feature) {
    return null;
  }

  if ((feature as unknown as Record<string, unknown>)._vectorTileFeature) {
    return {
      type: "Feature",
      geometry: feature.geometry,
      properties: feature.properties,
    } as Feature<Polygon | MultiPolygon>;
  }

  return feature;
};

const checkIfPointInPolygon = (
  coordinates: number[],
  polygon: Feature<Polygon | MultiPolygon>,
) => {
  if (!coordinates?.[0] || !coordinates?.[1]) {
    return false;
  }

  const point = turf.point(coordinates);
  return turf.booleanPointInPolygon(point, polygon);
};

export function getMarkersInsidePolygon(
  markers: PlacedMarker[],
  polygon: Feature<Polygon> | null | undefined,
) {
  if (!polygon) {
    return [];
  }

  return markers.filter((marker) => {
    return checkIfPointInPolygon([marker.point.lng, marker.point.lat], polygon);
  });
}

export function getRecordsInsideBoundary(
  data: {
    records: RecordsResponse;
    dataSource: DataSource | null;
  }[],
  boundaryFeature: Feature<Polygon | MultiPolygon> | null | undefined,
  markers: PointFeature[] | undefined,
) {
  if (!boundaryFeature) {
    return [];
  }

  return data.map((d) => {
    const recordsInsideTurf = d.records.records.filter((r) => {
      const coordinates =
        r?.geocodePoint?.lng && r?.geocodePoint?.lat
          ? [r?.geocodePoint?.lng, r?.geocodePoint?.lat]
          : markers?.find((m) => m.properties?.__recordId === r.id)?.geometry
              ?.coordinates || [];

      return checkIfPointInPolygon(coordinates, boundaryFeature);
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
