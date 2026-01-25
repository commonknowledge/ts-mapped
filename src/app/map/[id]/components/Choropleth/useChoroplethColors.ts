import { useEffect, useRef } from "react";
import { useFillColor } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapRef } from "@/app/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";

export function useChoroplethFillColor() {
  const { selectedBivariateBucket } = useChoropleth();

  const { viewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  // Get fill color
  const fillColor = useFillColor({
    areaStats,
    viewConfig,
    selectedBivariateBucket,
  });

  return fillColor;
}

export function useChoroplethFeatureStatesEffect() {
  const mapRef = useMapRef();
  const { choroplethLayerConfig, lastLoadedSourceId } = useChoropleth();
  const {
    mapbox: { sourceId, layerId },
  } = choroplethLayerConfig;

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});
  // Track previous values to avoid re-setting feature state for unchanged areas
  const prevAreaStatValues = useRef<
    Map<string, { primary: unknown; secondary: unknown }>
  >(new Map());

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
        map.setFeatureState(
          {
            source: sourceId,
            sourceLayer: layerId,
            id: areaCode,
          },
          { value: null, secondaryValue: null },
        );
      }
    }

    areaCodesToClean.current = nextAreaCodesToClean;
    prevAreaStatValues.current = nextStatValues;

    return () => {
      areaCodesToClean.current = {};
      prevAreaStatValues.current = new Map();
    };
  }, [areaStats, lastLoadedSourceId, layerId, mapRef, sourceId]);
}
