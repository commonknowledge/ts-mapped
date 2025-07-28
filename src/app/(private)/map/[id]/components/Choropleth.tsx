import { useContext, useEffect, useRef, useState } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useFillColor } from "@/app/(private)/map/[id]/colors";
import { ChoroplethContext } from "@/app/(private)/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import ChoroplethContextMenu from "./ChoroplethContextMenu";

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number } | null;
    feature: any;
  }>({
    isVisible: false,
    position: null,
    feature: null,
  });

  /* Set Mapbox feature state on receiving new AreaStats */
  useEffect(() => {
    if (!areaStatsQuery?.data) {
      return;
    }

    if (mapRef?.current?.getSource(sourceId)) {
      const nextAreaCodesToClean: Record<string, boolean> = {};
      areaStatsQuery.data.areaStats?.stats.forEach((stat) => {
        mapRef?.current?.setFeatureState(
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
      for (const areaCode in Object.keys(areaCodesToClean.current)) {
        if (!nextAreaCodesToClean[areaCode]) {
          mapRef?.current?.removeFeatureState({
            source: sourceId,
            sourceLayer: layerId,
            id: areaCode,
          });
        }
      }
      areaCodesToClean.current = nextAreaCodesToClean;
    }
  }, [areaStatsQuery, lastLoadedSourceId, layerId, mapRef, sourceId]);

  const fillColor = useFillColor(areaStatsQuery?.data?.areaStats);

  // Handle right-click on choropleth layers
  useEffect(() => {
    if (!mapRef?.current || !viewConfig.areaSetGroupCode) return;

    const handleContextMenu = (e: mapboxgl.MapMouseEvent) => {
      // Check if the layers exist before querying
      const map = mapRef.current;
      if (!map) return;
      
      const fillLayerId = `${sourceId}-fill`;
      const lineLayerId = `${sourceId}-line`;
      
      // Only proceed if at least one of our layers exists
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return;
      }

      // Build layers array with only existing layers
      const existingLayers = [];
      if (map.getLayer(fillLayerId)) {
        existingLayers.push(fillLayerId);
      }
      if (map.getLayer(lineLayerId)) {
        existingLayers.push(lineLayerId);
      }

      if (existingLayers.length === 0) {
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: existingLayers,
      });

      if (features && features.length > 0) {
        const feature = features[0];
        const point = map.project(e.lngLat);
        
        if (point) {
          setContextMenu({
            isVisible: true,
            position: { x: point.x, y: point.y },
            feature: feature,
          });
        }
      }
    };

    mapRef.current.on("contextmenu", handleContextMenu);

    return () => {
      mapRef.current?.off("contextmenu", handleContextMenu);
    };
  }, [mapRef, sourceId, viewConfig.areaSetGroupCode]);

  const handleCloseContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: null,
      feature: null,
    });
  };

  if (!viewConfig.areaSetGroupCode) {
    return null;
  }
  return (
    <>
      <Source
        id={sourceId}
        key={layerId}
        promoteId={featureCodeProperty}
        type="vector"
        url={`mapbox://${sourceId}`}
      >
        {/* Fill Layer */}
        <Layer
          id={`${sourceId}-fill`}
          source={sourceId}
          source-layer={layerId}
          type="fill"
          paint={{
            "fill-color": fillColor,
            "fill-opacity": 0.5,
          }}
        />

        {/* Line Layer */}
        {viewConfig.showBoundaryOutline && (
          <Layer
            id={`${sourceId}-line`}
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
      
      {/* Context Menu */}
      <ChoroplethContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        feature={contextMenu.feature}
        onClose={handleCloseContextMenu}
      />
    </>
  );
}
