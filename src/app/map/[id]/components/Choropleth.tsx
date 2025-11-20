import { useContext, useEffect, useRef } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext, getMapStyle } from "@/app/map/[id]/context/MapContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { CalculationType, ColorScheme, MapType } from "@/server/models/MapView";
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
    selectedBivariateBucket,
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
        { value: stat.primary, secondaryValue: stat.secondary },
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
    areaStatsQuery?.data,
    viewConfig.colorScheme || ColorScheme.RedBlue,
    viewConfig.calculationType === CalculationType.Count,
    Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket,
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
              "fill-opacity": viewConfig.showChoropleth ? 0.8 : 0,
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
              }}
            />
          }

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
