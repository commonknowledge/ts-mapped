import { useEffect, useRef } from "react";
import type { AreaStat } from "@/server/models/Area";
import type { ColumnType } from "@/server/models/DataSource";
import type { MapRef } from "react-map-gl/mapbox";

type AreaStatsData = {
  column: string;
  columnType: ColumnType;
  stats: AreaStat[];
} | null;

export function useChoroplethAreaStats(
  mapRef: React.RefObject<MapRef | null> | null,
  areaStatsData: AreaStatsData,
  sourceId: string,
  layerId: string,
  lastLoadedSourceId: string | undefined,
) {
  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});

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
}
