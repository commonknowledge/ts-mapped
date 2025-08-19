import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { MARKER_MATCHED_KEY, MARKER_NAME_KEY } from "@/constants";
import { mapColors } from "../styles";
import { DataSourceMarkers as DataSourceMarkersType } from "../types";

export default function Markers() {
  const { mapConfig, viewConfig } = useContext(MapContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);

  const memberMarkers = markerQueries?.data?.find(
    (ds) => ds.dataSourceId === mapConfig.membersDataSourceId,
  );

  const dataSourceMarkers = mapConfig.markerDataSourceIds.map((id) =>
    markerQueries?.data?.find((ds) => ds.dataSourceId === id),
  );

  return (
    <>
      {memberMarkers && viewConfig.showMembers && (
        <DataSourceMarkers
          key={memberMarkers.dataSourceId}
          dataSourceMarkers={memberMarkers}
          isMembers
        />
      )}
      {dataSourceMarkers.map((ds) => {
        if (!ds || !viewConfig.showLocations) {
          return null;
        }
        return (
          <DataSourceMarkers
            key={ds?.dataSourceId}
            dataSourceMarkers={ds}
            isMembers={false}
          />
        );
      })}
    </>
  );
}

function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
}: {
  dataSourceMarkers: DataSourceMarkersType;
  isMembers: boolean;
}) {
  const safeMarkers = dataSourceMarkers?.markers || {
    type: "FeatureCollection",
    features: [],
  };
  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const colors = isMembers ? mapColors.member : mapColors.dataSource;
  return (
    <Source
      id={sourceId}
      key={sourceId}
      type="geojson"
      data={safeMarkers}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
      clusterProperties={{
        matched_count: ["+", ["case", ["get", MARKER_MATCHED_KEY], 1, 0]],
      }}
    >
      <Layer
        id={`${sourceId}-circles`}
        type="circle"
        source={sourceId}
        filter={["has", "point_count"]}
        paint={{
          "circle-color": colors.color,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            1,
            50,
            1000,
            100,
          ],
          "circle-opacity": [
            "case",
            ["==", ["get", "matched_count"], 0],
            0.3,
            0.6,
          ],
        }}
      />
      <Layer
        id={`${sourceId}-counts`}
        type="symbol"
        source={sourceId}
        filter={["has", "point_count"]}
        layout={{
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 16,
        }}
        paint={{
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            4, // Smaller radius at low zoom levels
            10,
            6, // Larger radius at higher zoom levels
          ],
          "circle-color": colors.color,
          "circle-opacity": ["case", ["get", MARKER_MATCHED_KEY], 1, 0.5],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source="markers"
        filter={["!", ["has", "point_count"]]}
        minzoom={10}
        layout={{
          "text-field": ["get", MARKER_NAME_KEY],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, -1.25],
        }}
        paint={{
          "text-color": colors.color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
      {/* This layer here for styling purposes as it adds a glow effect to the markers */}
      <Layer
        id={`${sourceId}-heatmap`}
        type="heatmap"
        source={sourceId}
        filter={["has", "point_count"]}
        paint={{
          // Increase weight based on point count
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            0,
            0,
            10,
            1,
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            3,
          ],
          // Assign colors to heatmap based on density
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(103, 141, 227, 0)",
            0.2,
            "rgba(103, 141, 227, 0.2)",
            0.4,
            "rgba(103, 141, 227, 0.4)",
            0.6,
            "rgba(103, 141, 227, 0.6)",
            0.8,
            "rgba(103, 141, 227, 0.8)",
            1,
            "rgba(103, 141, 227, 1)",
          ],
          // Adjust radius based on zoom level
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 10, 20],
          // Opacity based on zoom level
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 15, 0],
        }}
      />
    </Source>
  );
}
