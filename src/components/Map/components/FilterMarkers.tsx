import { circle } from "@turf/turf";
import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
} from "geojson";
import { useContext, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { RecordFilterInput } from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { MARKER_ID_KEY } from "@/constants";
import { mapColors } from "../styles";

export default function FilterMarkers() {
  const { mapConfig, view } = useContext(MapContext);
  const { markerQueries, placedMarkers } = useContext(MarkerAndTurfContext);

  const memberMarkers = markerQueries?.data?.find(
    (ds) => ds.dataSourceId === mapConfig.membersDataSourceId,
  );

  const dataSourceMarkers = mapConfig.markerDataSourceIds.map((id) =>
    markerQueries?.data?.find((ds) => ds.dataSourceId === id),
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
                : dataSourceMarkers.find(
                    (dsm) => dsm?.dataSourceId === filterMarker.dataSourceId,
                  );
            const marker = allMarkers?.markers.features.find(
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
    dataSourceMarkers,
    mapConfig.membersDataSourceId,
    memberMarkers,
    placedMarkers,
    view?.dataSourceViews,
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
