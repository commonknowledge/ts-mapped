import { useContext, useEffect, useRef } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext, getMapStyle } from "@/app/map/[id]/context/MapContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/server/models/MapView";
import { useFillColor } from "../colors";
import { useAreaStats } from "../data";

export default function Choropleth() {
  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});
  const { mapRef } = useContext(MapContext);
  const { viewConfig } = useMapViews();
  const {
    lastLoadedSourceId,
    choroplethLayerConfig: {
      mapbox: { featureCodeProperty, featureNameProperty, sourceId, layerId },
    },
  } = useContext(ChoroplethContext);

  const areaStatsQuery = useAreaStats();

  /* Set Mapbox feature state on receiving new AreaStats */
  useEffect(() => {
    if (!areaStatsQuery?.data || !mapRef?.current) {
      return;
    }

    // Check if the source exists before proceeding
    const source = mapRef.current.getSource(sourceId);
    if (!source) {
      return;
    }

    // Overwrite previous feature states then remove any that weren't
    // overwritten, to avoid flicker and a bug where gaps would appear
    const nextAreaCodesToClean: Record<string, boolean> = {};
    areaStatsQuery.data.stats.forEach((stat) => {
      mapRef.current?.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerId,
          id: stat.areaCode,
        },
        { value: stat.value },
      );
      nextAreaCodesToClean[stat.areaCode] = true;
    });

    // Remove lingering feature states
    for (const areaCode of Object.keys(areaCodesToClean.current)) {
      if (!nextAreaCodesToClean[areaCode]) {
        mapRef?.current?.removeFeatureState({
          source: sourceId,
          sourceLayer: layerId,
          id: areaCode,
        });
      }
    }
    areaCodesToClean.current = nextAreaCodesToClean;
  }, [areaStatsQuery, lastLoadedSourceId, layerId, mapRef, sourceId]);

  /* Set cursor to pointer and darken fill on hover over choropleth areas */
  useEffect(() => {
    if (!mapRef?.current) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;
    const prevPointer = { cursor: "" };
    let hoveredFeatureId: string | number | undefined;

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId, lineLayerId].filter((l) => map.getLayer(l)),
      });

      if (features?.length) {
        const feature = features[0];

        // Remove hover state from previous feature
        if (hoveredFeatureId !== undefined) {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
        }

        // Set hover state on current feature
        if (feature.id !== undefined) {
          hoveredFeatureId = feature.id;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: true },
          );
        }

        if (map.getCanvas().style.cursor !== "pointer") {
          prevPointer.cursor = map.getCanvas().style.cursor || "";
        }
        map.getCanvas().style.cursor = "pointer";
      } else {
        if (hoveredFeatureId !== undefined) {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
          hoveredFeatureId = undefined;
        }

        if (map.getCanvas().style.cursor === "pointer") {
          map.getCanvas().style.cursor = prevPointer.cursor;
        }
      }
    };

    const onMouseLeave = () => {
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
        hoveredFeatureId = undefined;
      }
      map.getCanvas().style.cursor = prevPointer.cursor;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mousemove", onMouseMove as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mouseleave", onMouseLeave as any);

    return () => {
      // Clean up hover state on unmount
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mousemove", onMouseMove as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mouseleave", onMouseLeave as any);
    };
  }, [mapRef, sourceId, layerId]);

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
                "line-color": "#999",
                "line-width": 1,
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
