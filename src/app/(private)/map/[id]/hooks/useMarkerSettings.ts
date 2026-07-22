"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { markerSettingsDataSourceIdAtom } from "../atoms/markerAtoms";
import { useMapViews } from "./useMapViews";
import type { MarkerVisualisation } from "@/models/MapView";

export function useMarkerSettings() {
  const [markerSettingsDataSourceId, setMarkerSettingsDataSourceId] = useAtom(
    markerSettingsDataSourceIdAtom,
  );
  const { viewConfig, updateViewConfig } = useMapViews();

  const getMarkerVisualisation = useCallback(
    (dataSourceId: string): MarkerVisualisation =>
      viewConfig.markerVisualisations?.[dataSourceId] ?? {},
    [viewConfig.markerVisualisations],
  );

  const patchMarkerVisualisation = useCallback(
    (dataSourceId: string, patch: Partial<MarkerVisualisation>) => {
      const current = viewConfig.markerVisualisations?.[dataSourceId] ?? {};
      updateViewConfig({
        markerVisualisations: {
          ...viewConfig.markerVisualisations,
          [dataSourceId]: { ...current, ...patch },
        },
      });
    },
    [updateViewConfig, viewConfig.markerVisualisations],
  );

  return {
    markerSettingsDataSourceId,
    setMarkerSettingsDataSourceId,
    getMarkerVisualisation,
    patchMarkerVisualisation,
  };
}
