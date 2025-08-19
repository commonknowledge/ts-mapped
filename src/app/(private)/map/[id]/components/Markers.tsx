import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { MARKER_NAME_KEY } from "@/constants";
import { mapColors } from "../styles";
import { DataSourceMarkers as DataSourceMarkersType } from "../types";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
      // Disable clustering; use heatmap for density instead
    >
      {/* Heatmap layer replaces cluster circles/counts */}
      <Layer
        id={`${sourceId}-heatmap`}
        type="heatmap"
        source={sourceId}
        maxzoom={9}
        paint={{
          // Uniform weight (adjust if you have a numeric property to weight by)
          "heatmap-weight": 1,
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            9,
            3,
          ],
          // Color ramp using the layer's base color
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            rgbaString(colors.color, 0),
            0.2,
            rgbaString(colors.color, 0.2),
            0.4,
            rgbaString(colors.color, 0.4),
            0.6,
            rgbaString(colors.color, 0.6),
            0.8,
            rgbaString(colors.color, 0.8),
            1,
            rgbaString(colors.color, 1),
          ],
          // Radius scales with zoom
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          // Transition from heatmap to circles by zoom level
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
        }}
      />

      {/* Individual pins for higher zooms */}
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        minzoom={8}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 8],
          "circle-color": colors.color,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />

      {/* Labels for pins at higher zooms */}
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source={sourceId}
        minzoom={12}
        layout={{
          "text-field": ["get", MARKER_NAME_KEY],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, 1],
          "text-anchor": "top",
        }}
        paint={{
          "text-color": colors.color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
    </Source>
  );
}
