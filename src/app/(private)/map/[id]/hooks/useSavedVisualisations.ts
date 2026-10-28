"use client";

import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_CALCULATION_TYPE } from "@/models/shared";
import { useMapViews } from "./useMapViews";
import type { MapViewConfig, SavedVisualisation } from "@/models/MapView";

// Views from before the list existed have a live visualisation but no id
const UNSAVED_ID = "unsaved";

const snapshot = (config: MapViewConfig, id: string): SavedVisualisation => ({
  id,
  areaDataSourceId: config.areaDataSourceId,
  areaDataColumn: config.areaDataColumn,
  areaDataSecondaryColumn: config.areaDataSecondaryColumn,
  calculationType: config.calculationType,
  colorScheme: config.colorScheme,
  reverseColorScheme: config.reverseColorScheme,
  colorScaleType: config.colorScaleType,
  customColor: config.customColor,
  includeColumnsString: config.includeColumnsString,
});

// The live view-config fields a saved visualisation restores
const toLiveConfig = (item: SavedVisualisation | null) => ({
  areaDataSourceId: item?.areaDataSourceId ?? "",
  areaDataColumn: item?.areaDataColumn ?? "",
  areaDataSecondaryColumn: item?.areaDataSecondaryColumn,
  calculationType: item?.calculationType ?? DEFAULT_CALCULATION_TYPE,
  colorScheme: item?.colorScheme ?? null,
  reverseColorScheme: item?.reverseColorScheme ?? null,
  colorScaleType: item?.colorScaleType,
  customColor: item?.customColor,
  includeColumnsString: item?.includeColumnsString,
});

/**
 * A view's list of visualisations (data source + column) to switch between.
 * The active one is the view's live choropleth config; switching saves its
 * current settings back to the list and loads the chosen one.
 */
export function useSavedVisualisations() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const saved = useMemo(
    () => viewConfig.savedVisualisations ?? [],
    [viewConfig.savedVisualisations],
  );

  const hasLive = Boolean(viewConfig.areaDataSourceId);
  const activeId = hasLive
    ? (viewConfig.activeVisualisationId ?? UNSAVED_ID)
    : null;

  // Saved entries, with the active one showing its live settings
  const items = useMemo(() => {
    if (!activeId) return saved;
    const live = snapshot(viewConfig, activeId);
    return saved.some((item) => item.id === activeId)
      ? saved.map((item) => (item.id === activeId ? live : item))
      : [live, ...saved];
  }, [activeId, saved, viewConfig]);

  // The list with the live settings written back, ready to switch away
  const withLiveSaved = useCallback((): SavedVisualisation[] => {
    if (!activeId) return saved;
    const id = activeId === UNSAVED_ID ? uuidv4() : activeId;
    const live = snapshot(viewConfig, id);
    return saved.some((item) => item.id === id)
      ? saved.map((item) => (item.id === id ? live : item))
      : [live, ...saved];
  }, [activeId, saved, viewConfig]);

  const select = useCallback(
    (id: string) => {
      if (id === activeId) return;
      const list = withLiveSaved();
      const item = list.find((v) => v.id === id) ?? null;
      updateViewConfig({
        savedVisualisations: list,
        activeVisualisationId: item?.id,
        ...toLiveConfig(item),
      });
    },
    [activeId, updateViewConfig, withLiveSaved],
  );

  /** Saves the current visualisation and starts an empty one, optionally
   *  on a given data source, for the user to finish in the flyout */
  const startNew = useCallback(
    (dataSourceId?: string) => {
      updateViewConfig({
        savedVisualisations: withLiveSaved(),
        activeVisualisationId: uuidv4(),
        ...toLiveConfig(null),
        areaDataSourceId: dataSourceId ?? "",
      });
    },
    [updateViewConfig, withLiveSaved],
  );

  const remove = useCallback(
    (id: string) => {
      const remaining = saved.filter((item) => item.id !== id);
      if (id !== activeId) {
        updateViewConfig({ savedVisualisations: remaining });
        return;
      }
      // Removing the active one falls back to the next in the list
      const next = remaining[0] ?? null;
      updateViewConfig({
        savedVisualisations: remaining,
        activeVisualisationId: next?.id,
        ...toLiveConfig(next),
      });
    },
    [activeId, saved, updateViewConfig],
  );

  return { items, activeId, select, startNew, remove };
}
