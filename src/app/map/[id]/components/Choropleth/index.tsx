import { Layer, Source } from "react-map-gl/mapbox";
import { getMapStyle } from "@/app/map/[id]/context/MapContext";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MapType } from "@/server/models/MapView";
import { useChoroplethAreaStats } from "./useChoroplethAreaStats";

export default function Choropleth() {
  const { viewConfig } = useMapViews();
  const {
    choroplethLayerConfig: {
      mapbox: { featureCodeProperty, featureNameProperty, sourceId, layerId },
    },
  } = useChoropleth();
  const choroplethTopLayerId = "choropleth-top";

  // Custom hooks for effects
  const fillColor = useChoroplethAreaStats();
  const opacity = (viewConfig.choroplethOpacityPct ?? 80) / 100;

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
        <Layer
          id={`${choroplethTopLayerId}-line`}
          source={choroplethTopLayerId}
          type="circle"
        />
      </Source>
      {viewConfig.areaSetGroupCode && (
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
              "fill-opacity": viewConfig.showChoropleth ? opacity : 0,
            }}
          />

          <Layer
            id={`${sourceId}-hover-overlay`}
            beforeId={choroplethTopLayerId}
            source={sourceId}
            source-layer={layerId}
            type="fill"
            paint={{
              "fill-color": "#000000",
              "fill-opacity": viewConfig.showChoropleth
                ? [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    // When hovering, apply darkness
                    0.25,
                    // Otherwise completely transparent
                    0,
                  ]
                : 0,
            }}
          />

          {/* Line Layer - show for both boundary-only and choropleth */}
          {
            <Layer
              id={`${sourceId}-line`}
              beforeId={`${choroplethTopLayerId}-line`}
              source={sourceId}
              source-layer={layerId}
              type="line"
              paint={{
                "line-color": "#999",
                "line-width": 1,
                "line-opacity": 1,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          }

          {/* Active outline drawn above other lines */}
          <Layer
            id={`${sourceId}-active-outline`}
            beforeId={`${choroplethTopLayerId}-line`}
            source={sourceId}
            source-layer={layerId}
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["feature-state", "active"], true],
                "rgb(37, 99, 235)",
                "rgba(37, 99, 235, 0)",
              ],
              "line-width": [
                "case",
                ["==", ["feature-state", "active"], true],
                2,
                0,
              ],
              "line-opacity": [
                "case",
                ["==", ["feature-state", "active"], true],
                1,
                0,
              ],
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />

          {/* Symbol Layer (Labels) */}
          {viewConfig.mapType !== MapType.Hex && viewConfig.showLabels && (
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
