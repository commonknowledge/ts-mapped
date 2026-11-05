"use client";

import { useCallback } from "react";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorActiveSource } from "../../hooks/useInspectorActiveSource";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";

/**
 * Opens the data panel to pick a visualisation. On an empty view that only
 * prompts; if a visualisation is already on (or a source is given), saves
 * it and starts a new one first. The inspector follows the new source.
 */
export function useAddAreaData() {
  const { startNew, activeId } = useSavedVisualisations();
  const { viewConfig } = useMapViews();
  const { setBoundariesPanelOpen } = useChoropleth();
  const [, setActiveSourceId] = useInspectorActiveSource();

  return useCallback(
    (dataSourceId?: string) => {
      const hasVisualisation = Boolean(activeId || viewConfig.areaDataSourceId);
      if (dataSourceId || hasVisualisation) {
        startNew({ dataSourceId });
      }
      setBoundariesPanelOpen(true);
      setActiveSourceId(dataSourceId ?? null);
    },
    [
      activeId,
      setActiveSourceId,
      setBoundariesPanelOpen,
      startNew,
      viewConfig.areaDataSourceId,
    ],
  );
}
