"use client";

import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { boundariesPanelOpenAtom } from "../atoms/choroplethAtoms";
import { markerSettingsDataSourceIdAtom } from "../atoms/markerAtoms";
import { useMapViews } from "./useMapViews";
import type { MarkerVisualisation } from "@/models/MapView";

export function useMarkerSettings() {
  const [markerSettingsDataSourceId, _setMarkerSettingsDataSourceId] = useAtom(
    markerSettingsDataSourceIdAtom,
  );
  const setBoundariesPanelOpen = useSetAtom(boundariesPanelOpenAtom);
  // The visualisation flyout takes the same place, so only one is open
  const setMarkerSettingsDataSourceId = useCallback(
    (dataSourceId: string | null) => {
      if (dataSourceId) {
        setBoundariesPanelOpen(false);
      }
      _setMarkerSettingsDataSourceId(dataSourceId);
    },
    [_setMarkerSettingsDataSourceId, setBoundariesPanelOpen],
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
