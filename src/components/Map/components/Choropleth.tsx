import { useContext, useEffect, useRef } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/__generated__/types";
import { useFillColor } from "@/components/Map/colors";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";

export default function Choropleth() {
  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});
  const { mapRef, viewConfig } = useContext(MapContext);
  const {
    areaStatsQuery,
    lastLoadedSourceId,
    choroplethLayerConfig: {
      mapbox: { featureCodeProperty, featureNameProperty, sourceId, layerId },
    },
  } = useContext(ChoroplethContext);

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

    const nextAreaCodesToClean: Record<string, boolean> = {};
    areaStatsQuery.data.areaStats?.stats.forEach((stat) => {
      mapRef.current?.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerId,
          id: stat.areaCode,
        },
        stat,
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

  const fillColor = useFillColor(
    areaStatsQuery?.data?.areaStats,
    viewConfig.colorScheme || ColorScheme.RedBlue,
    viewConfig.calculationType === CalculationType.Count,
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
          {viewConfig.visualisationType === VisualisationType.Choropleth && (
            <Layer
              id={`${sourceId}-fill`}
              beforeId={choroplethTopLayerId}
              source={sourceId}
              source-layer={layerId}
              type="fill"
              paint={{
                "fill-color": fillColor,
                "fill-opacity": 0.8, // Higher opacity to ensure colors are visible
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
                "text-color": viewConfig.getMapStyle().textColor,
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0.8,
                  10,
                  0.8,
                ],
                "text-halo-color": viewConfig.getMapStyle().textHaloColor,
                "text-halo-width": 1.5,
              }}
            />
          )}
        </Source>
      )}
    </>
  );
}
