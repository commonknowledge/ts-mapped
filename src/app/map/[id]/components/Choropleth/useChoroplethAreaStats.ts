import { useContext, useEffect, useRef } from "react";
import { useFillColor } from "@/app/map/[id]/colors";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  CalculationType,
  ColorScheme,
} from "@/server/models/MapView";

export function useChoroplethAreaStats() {
  const { mapRef } = useContext(MapContext);
  const { choroplethLayerConfig, lastLoadedSourceId } = useContext(ChoroplethContext);
  const {
    mapbox: { sourceId, layerId },
  } = choroplethLayerConfig;

  const { viewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStatsData = areaStatsQuery.data;

  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});

  // Get fill color
  const fillColor = useFillColor(
    areaStatsData,
    viewConfig.colorScheme || ColorScheme.RedBlue,
    viewConfig.calculationType === CalculationType.Count,
    Boolean(viewConfig.reverseColorScheme),
  );

  useEffect(() => {
    if (!areaStatsData || !mapRef?.current) {
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
    areaStatsData.stats.forEach((stat) => {
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
  }, [areaStatsData, lastLoadedSourceId, layerId, mapRef, sourceId]);

  return fillColor;
}
