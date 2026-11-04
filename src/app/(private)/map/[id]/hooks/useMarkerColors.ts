"use client";

import { useCallback, useMemo } from "react";
import { useMapConfig } from "./useMapConfig";
import { useMapViews } from "./useMapViews";

/**
 * Marker layer colours, by data source, shared by every view of the map so
 * switching views never recolours a layer. Colours picked per view before
 * they were shared still show (the earliest view's wins) until replaced.
 */
export function useMarkerColors() {
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { views } = useMapViews();

  const markerColors = useMemo(() => {
    const legacy = [...views]
      .reverse()
      .reduce<Record<string, string>>(
        (colors, view) => ({ ...colors, ...view.config.markerColors }),
        {},
      );
    return { ...legacy, ...mapConfig.markerColors };
  }, [views, mapConfig.markerColors]);

  const setMarkerColor = useCallback(
    ({ dataSourceId, color }: { dataSourceId: string; color: string }) =>
      updateMapConfig({
        markerColors: { ...markerColors, [dataSourceId]: color },
      }),
    [markerColors, updateMapConfig],
  );

  return { markerColors, setMarkerColor };
}
