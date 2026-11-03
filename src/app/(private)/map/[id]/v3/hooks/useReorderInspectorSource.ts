"use client";

import { useCallback } from "react";
import { useInspectorLayers } from "../../hooks/useInspectorLayers";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";

/**
 * Moves an inspector tab to where another is. Tabs for Areas data reorder
 * the Areas list itself, so the two stay in the same order; anything else
 * only reorders the inspector.
 */
export function useReorderInspectorSource() {
  const { items, moveSource } = useSavedVisualisations();
  const { moveTo } = useInspectorLayers();

  return useCallback(
    (dataSourceId: string, targetDataSourceId: string) => {
      const isArea = (id: string) =>
        items.some((item) => item.areaDataSourceId === id);
      if (isArea(dataSourceId) && isArea(targetDataSourceId)) {
        moveSource(dataSourceId, targetDataSourceId);
      } else {
        moveTo(dataSourceId, targetDataSourceId);
      }
    },
    [items, moveSource, moveTo],
  );
}
