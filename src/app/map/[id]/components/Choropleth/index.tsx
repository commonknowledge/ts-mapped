import { useContext } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useFillColor } from "@/app/map/[id]/colors";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext, getMapStyle } from "@/app/map/[id]/context/MapContext";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/server/models/MapView";
import { useAreaStatsFeatureState } from "./useAreaStats";
import { useChoroplethClick } from "./useChoroplethClick";
import { useChoroplethHover } from "./useChoroplethHover";

export default function Choropleth() {
  const { mapRef } = useContext(MapContext);
  const { viewConfig } = useMapViews();
  const {
    lastLoadedSourceId,
    choroplethLayerConfig: {
      areaSetCode,
      mapbox: { featureCodeProperty, featureNameProperty, sourceId, layerId },
    },
  } = useContext(ChoroplethContext);
  const { setSelectedBoundary, resetInspector } = useContext(InspectorContext);

  const areaStatsQuery = useAreaStats();

  // Custom hooks for effects
  useAreaStatsFeatureState(
    mapRef,
    areaStatsQuery.data,
    sourceId,
    layerId,
    lastLoadedSourceId,
  );

  useChoroplethHover(mapRef, sourceId, layerId);

  useChoroplethClick(
    mapRef,
    sourceId,
    layerId,
    featureCodeProperty,
    featureNameProperty,
    areaSetCode,
    resetInspector,
    setSelectedBoundary,
  );

  const fillColor = useFillColor(
    areaStatsQuery?.data,
    viewConfig.colorScheme || ColorScheme.RedBlue,
    viewConfig.calculationType === CalculationType.Count,
    Boolean(viewConfig.reverseColorScheme),
  );

  const choroplethTopLayerId = "choropleth-top";
  return (
    <>
      {/* Position layer */}
      <Source
        id={choroplethTopLayerId}
        key={choroplethTopLayerId}
        type="geojson"
        data={{ type: "FeatureCollection", features: [] }}
      >
        <Layer
          id={choroplethTopLayerId}
          source={choroplethTopLayerId}
          type="circle"
        />
      </Source>
      {viewConfig.areaSetGroupCode && viewConfig.visualisationType && (
        <Source
          id={sourceId}
          key={layerId}
          promoteId={featureCodeProperty}
          type="vector"
          url={`mapbox://${sourceId}`}
        >
          {/* Fill Layer - only show for choropleth */}
          <Layer
            id={`${sourceId}-fill`}
            beforeId={choroplethTopLayerId}
            source={sourceId}
            source-layer={layerId}
            type="fill"
            paint={{
              "fill-color": fillColor,
              "fill-opacity": [
                "case",
                ["feature-state", "hover"],
                // When hovering, increase opacity to make it appear darker
                viewConfig.visualisationType === VisualisationType.Choropleth
                  ? 1
                  : 0,
                // Normal opacity
                viewConfig.visualisationType === VisualisationType.Choropleth
                  ? 0.8
                  : 0,
              ],
            }}
          />

          {/* Hover overlay layer - darkens areas on hover (only for choropleth) */}
          {viewConfig.visualisationType === VisualisationType.Choropleth && (
            <Layer
              id={`${sourceId}-hover-overlay`}
              beforeId={choroplethTopLayerId}
              source={sourceId}
              source-layer={layerId}
              type="fill"
              paint={{
                "fill-color": "#000000",
                "fill-opacity": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  // When hovering, apply darkness
                  0.2,
                  // Otherwise completely transparent
                  0,
                ],
              }}
            />
          )}

          {/* Line Layer - show for both boundary-only and choropleth */}
          {(viewConfig.visualisationType === VisualisationType.BoundaryOnly ||
            viewConfig.visualisationType === VisualisationType.Choropleth) && (
            <Layer
              id={`${sourceId}-line`}
              beforeId={choroplethTopLayerId}
              source={sourceId}
              source-layer={layerId}
              type="line"
              paint={{
                "line-color": [
                  "case",
                  ["boolean", ["feature-state", "active"], false],
                  "rgb(37, 99, 235)",
                  "#999",
                ],
                "line-width": [
                  "case",
                  ["boolean", ["feature-state", "active"], false],
                  2,
                  1,
                ],
              }}
            />
          )}

          {/* Symbol Layer (Labels) */}
          {viewConfig.showLabels && (
            <Layer
              id={`${sourceId}-labels`}
              beforeId={choroplethTopLayerId}
              source={sourceId}
              source-layer={layerId}
              type="symbol"
              layout={{
                "symbol-placement": "point",
                "text-field": ["get", featureNameProperty],
                "text-size": 14,
                "text-anchor": "center",
                "text-allow-overlap": false,
                "symbol-spacing": 100,
                "text-max-width": 8,
                "text-padding": 30,
                "text-transform": "uppercase",
                "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              }}
              paint={{
                "text-color": getMapStyle(viewConfig).textColor,
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0.8,
                  10,
                  0.8,
                ],
                "text-halo-color": getMapStyle(viewConfig).textHaloColor,
                "text-halo-width": 1.5,
              }}
            />
          )}
        </Source>
      )}
    </>
  );
}
