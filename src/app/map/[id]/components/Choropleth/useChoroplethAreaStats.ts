import { useEffect, useRef } from "react";
import { useFillColor } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { ColorScheme } from "@/server/models/MapView";
import { useMapRef } from "../../hooks/useMapCore";

export function useChoroplethAreaStats() {
  const mapRef = useMapRef();
  const { choroplethLayerConfig, lastLoadedSourceId, selectedBivariateBucket } =
    useChoropleth();
  const {
    mapbox: { sourceId, layerId },
  } = choroplethLayerConfig;

  const { viewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});

  // Get fill color
  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket,
  });

  useEffect(() => {
    if (!areaStats || !mapRef?.current) {
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
    areaStats.stats.forEach((stat) => {
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
  }, [areaStats, lastLoadedSourceId, layerId, mapRef, sourceId]);

  return fillColor;
}
