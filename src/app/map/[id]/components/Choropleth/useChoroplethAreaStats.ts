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
  // Track previous values to avoid re-setting feature state for unchanged areas
  const prevAreaStatValues = useRef<
    Map<string, { primary: unknown; secondary: unknown }>
  >(new Map());

  // Get fill color
  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket,
    categoryColors: viewConfig.categoryColors,
    colorScaleType: viewConfig.colorScaleType,
    steppedColorSteps: viewConfig.steppedColorSteps,
    customColor: viewConfig.customColor,
  });

  useEffect(() => {
    const map = mapRef?.current;
    if (!areaStats || !map) {
      return;
    }

    // Check if the source exists before proceeding
    const source = map.getSource(sourceId);
    if (!source) {
      return;
    }

    const nextAreaCodesToClean: Record<string, boolean> = {};
    const nextStatValues = new Map<
      string,
      { primary: unknown; secondary: unknown }
    >();

    // Only set feature state when the values actually change to avoid expensive re-renders
    areaStats.stats.forEach((stat) => {
      const key = stat.areaCode;
      const prev = prevAreaStatValues.current.get(key);
      const next = {
        primary:
          stat.primary !== null && stat.primary !== undefined
            ? stat.primary
            : null,
        secondary:
          stat.secondary !== null && stat.secondary !== undefined
            ? stat.secondary
            : null,
      };
      nextStatValues.set(key, next);

      if (
        !prev ||
        prev.primary !== next.primary ||
        prev.secondary !== next.secondary
      ) {
        map.setFeatureState(
          {
            source: sourceId,
            sourceLayer: layerId,
            id: stat.areaCode,
          },
          { value: stat.primary, secondaryValue: stat.secondary },
        );
      }

      nextAreaCodesToClean[stat.areaCode] = true;
    });

    // Remove lingering feature states for areas no longer present
    for (const areaCode of Object.keys(areaCodesToClean.current)) {
      if (!nextAreaCodesToClean[areaCode]) {
        map.removeFeatureState({
          source: sourceId,
          sourceLayer: layerId,
          id: areaCode,
        });
      }
    }

    areaCodesToClean.current = nextAreaCodesToClean;
    prevAreaStatValues.current = nextStatValues;
  }, [areaStats, lastLoadedSourceId, layerId, mapRef, sourceId]);

  return fillColor;
}
