import { circle } from "@turf/turf";
import { useContext, useEffect, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { MARKER_ID_KEY } from "@/constants";
import { mapColors } from "../styles";
import type { RecordFilterInput } from "@/__generated__/types";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
} from "geojson";
import type { LngLatBoundsLike } from "mapbox-gl";

export default function FilterMarkers() {
  const { mapRef, mapId, view } = useContext(MapContext);
  const { mapConfig } = useMapConfig(mapId);
  const { markerQueries, placedMarkers, turfs } =
    useContext(MarkerAndTurfContext);

  const { selectedDataSourceId } = useContext(TableContext);

  const memberMarkers = useMemo(
    () =>
      markerQueries?.data.find(
        (dsm) => dsm.dataSourceId === mapConfig.membersDataSourceId,
      ),
    [markerQueries, mapConfig.membersDataSourceId],
  );

  const otherMarkers = useMemo(
    () =>
      mapConfig.markerDataSourceIds.map((id) =>
        markerQueries?.data.find((dsm) => dsm.dataSourceId === id),
      ),
    [markerQueries, mapConfig.markerDataSourceIds],
  );

  const { memberFilterMarkers, otherFilterMarkers } = useMemo(() => {
    let memberFilterMarkers: Feature<Polygon, GeoJsonProperties>[] = [];
    let otherFilterMarkers: Feature<Polygon, GeoJsonProperties>[] = [];
    // For each data source being filtered, get the markers that are being used
    for (const dataSourceView of view?.dataSourceViews || []) {
      // Get the marker IDs from the filter
      const filterMarkers = getFilterMarkers(dataSourceView.filter);
      // Create a GeoJSON feature for each marker in the filter, with the radius in the feature properties
      const filterMarkerFeatures = filterMarkers
        .map((filterMarker) => {
          if (filterMarker.placedMarkerId) {
            const placedMarker = placedMarkers.find(
              (placedMarker) => placedMarker.id === filterMarker.placedMarkerId,
            );
            if (placedMarker) {
              return circle(
                [placedMarker.point.lng, placedMarker.point.lat],
                filterMarker.radius,
                {
                  units: "kilometers",
                  properties: {
                    fill: mapColors.markers.color,
                  },
                },
              );
            }
          }
          if (filterMarker.dataRecordId && filterMarker.dataSourceId) {
            const allMarkers =
              filterMarker.dataSourceId === mapConfig.membersDataSourceId
                ? memberMarkers
                : otherMarkers.find(
                    (dsm) => dsm?.dataSourceId === filterMarker.dataSourceId,
                  );
            const marker = allMarkers?.markers?.find(
              (feature) =>
                feature.properties[MARKER_ID_KEY] === filterMarker.dataRecordId,
            );
            if (marker) {
              return circle(marker.geometry.coordinates, filterMarker.radius, {
                units: "kilometers",
                properties: {
                  fill:
                    filterMarker.dataSourceId === mapConfig.membersDataSourceId
                      ? mapColors.member.color
                      : mapColors.markers.color,
                },
              });
            }
          }
        })
        .filter((f) => f !== undefined);

      if (dataSourceView.dataSourceId === mapConfig.membersDataSourceId) {
        memberFilterMarkers = filterMarkerFeatures;
      } else {
        otherFilterMarkers = otherFilterMarkers.concat(filterMarkerFeatures);
      }
    }

    return {
      memberFilterMarkers,
      otherFilterMarkers,
    };
  }, [
    mapConfig.membersDataSourceId,
    memberMarkers,
    otherMarkers,
    placedMarkers,
    view?.dataSourceViews,
  ]);

  const filterTurfs: Polygon[] = useMemo(() => {
    let filterTurfs: Polygon[] = [];
    for (const dataSourceView of view?.dataSourceViews || []) {
      const filter = dataSourceView.filter;
      const dataSourceTurfs = getFilterTurfs(filter)
        .map((turfId) => turfs?.find((t) => t.id === turfId)?.polygon)
        .filter((t) => t !== undefined);
      filterTurfs = filterTurfs.concat(dataSourceTurfs as Polygon[]);
    }
    return filterTurfs;
  }, [turfs, view?.dataSourceViews]);

  // Pan to markers when the table view is opened / filters changed
  useEffect(() => {
    if (!selectedDataSourceId) {
      return;
    }
    if (
      memberFilterMarkers.length ||
      otherFilterMarkers.length ||
      filterTurfs.length
    ) {
      const allPolygons = memberFilterMarkers
        .concat(otherFilterMarkers)
        .map((m) => m.geometry)
        .concat(filterTurfs);
      const bounds = calculateBounds(allPolygons);
      if (bounds) {
        mapRef?.current?.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
      }
    }
  }, [
    mapRef,
    memberFilterMarkers,
    otherFilterMarkers,
    filterTurfs,
    selectedDataSourceId,
  ]);

  return (
    <>
      <Markers markers={memberFilterMarkers} isMembers={true} />
      <Markers markers={otherFilterMarkers} isMembers={false} />
    </>
  );
}

function Markers({
  markers,
  isMembers,
}: {
  markers: Feature<Polygon, GeoJsonProperties>[];
  isMembers: boolean;
}) {
  const features: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: markers,
  };

  const layerId = `filter-markers${isMembers ? "-members" : "-other"}`;
  return (
    <Source id={layerId} type="geojson" data={features}>
      <Layer
        id={`${layerId}-fill`}
        type="fill"
        paint={{
          "fill-color": ["get", "fill"],
          "fill-opacity": 0.1,
        }}
      />
      <Layer
        id={`${layerId}-stroke`}
        type="line"
        paint={{
          "line-color": isMembers
            ? mapColors.member.color
            : mapColors.markers.color,
          "line-width": 2,
          "line-dasharray": [2, 2],
        }}
      />
    </Source>
  );
}

// Recursively get all markers in a filter
interface FilterMarkerConfig {
  placedMarkerId?: string;
  dataRecordId?: string;
  dataSourceId?: string;
  radius: number;
}
const getFilterMarkers = (filter: RecordFilterInput): FilterMarkerConfig[] => {
  let filterMarkers: FilterMarkerConfig[] = [];
  if (filter.placedMarker) {
    filterMarkers.push({
      placedMarkerId: filter.placedMarker,
      radius: filter.distance || 0,
    });
  }
  if (filter.dataRecordId && filter.dataSourceId) {
    filterMarkers.push({
      dataRecordId: filter.dataRecordId,
      dataSourceId: filter.dataSourceId,
      radius: filter.distance || 0,
    });
  }
  for (const childFilter of filter.children || []) {
    filterMarkers = filterMarkers.concat(getFilterMarkers(childFilter));
  }
  return filterMarkers;
};

const getFilterTurfs = (filter: RecordFilterInput): string[] => {
  let filterTurfs: string[] = [];
  if (filter.turf) {
    filterTurfs.push(filter.turf);
  }
  for (const childFilter of filter.children || []) {
    filterTurfs = filterTurfs.concat(getFilterTurfs(childFilter));
  }
  return filterTurfs;
};

const calculateBounds = (polygons: Polygon[]): LngLatBoundsLike | null => {
  if (polygons.length === 0) {
    return null;
  }

  let minLng = null;
  let maxLng = null;
  let minLat = null;
  let maxLat = null;

  // Iterate through all polygons
  for (const polygon of polygons) {
    // Iterate through all rings (exterior + holes)
    for (const ring of polygon.coordinates) {
      // Iterate through all coordinates in the ring
      for (const [lng, lat] of ring) {
        minLng = minLng === null ? lng : Math.min(minLng, lng);
        maxLng = maxLng === null ? lng : Math.max(maxLng, lng);
        minLat = minLat === null ? lat : Math.min(minLat, lat);
        maxLat = maxLat === null ? lat : Math.max(maxLat, lat);
      }
    }
  }

  if (!minLng || !maxLng || !minLat || !maxLat) {
    return null;
  }

  // Return in Mapbox fitBounds format: [[west, south], [east, north]]
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};
