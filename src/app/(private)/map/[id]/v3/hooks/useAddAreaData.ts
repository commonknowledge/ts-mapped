"use client";

import { useCallback } from "react";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorActiveSource } from "../../hooks/useInspectorActiveSource";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";

/**
 * Adds data to the Areas list: starts a visualisation (optionally on a given
 * source) and opens the data panel to pick it. The inspector shows the new
 * source's tab, since the Areas list and the inspector's tabs are one list.
 */
export function useAddAreaData() {
  const { startNew } = useSavedVisualisations();
  const { setBoundariesPanelOpen } = useChoropleth();
  const [, setActiveSourceId] = useInspectorActiveSource();

  return useCallback(
    (dataSourceId?: string) => {
      startNew({ dataSourceId });
      setBoundariesPanelOpen(true);
      // With no tab chosen, the inspector follows the visualised source
      setActiveSourceId(dataSourceId ?? null);
    },
    [setActiveSourceId, setBoundariesPanelOpen, startNew],
  );
}
