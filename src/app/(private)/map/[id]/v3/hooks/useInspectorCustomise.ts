"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useInspectorActiveSource } from "../../hooks/useInspectorActiveSource";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { inspectorEditingDataSourceIdAtom } from "../atoms";
import { useAddMarkersPanel } from "./useAddMarkersPanel";

export function useInspectorEditingDataSourceId() {
  return useAtom(inspectorEditingDataSourceIdAtom);
}

/** Opens an inspector section in the edit panel, in place of any flyout,
 *  and shows its tab so edits can be seen as they're made */
export function useOpenInspectorSectionEditor() {
  const [, setDataSourceId] = useInspectorEditingDataSourceId();
  const [, setActiveSourceId] = useInspectorActiveSource();
  const { setBoundariesPanelOpen } = useChoropleth();
  const { setMarkerSettingsDataSourceId } = useMarkerSettings();
  const [, setIsMarkersPanelOpen] = useAddMarkersPanel();

  return useCallback(
    (dataSourceId: string) => {
      setBoundariesPanelOpen(false);
      setMarkerSettingsDataSourceId(null);
      setIsMarkersPanelOpen(false);
      setDataSourceId(dataSourceId);
      setActiveSourceId(dataSourceId);
    },
    [
      setActiveSourceId,
      setBoundariesPanelOpen,
      setDataSourceId,
      setIsMarkersPanelOpen,
      setMarkerSettingsDataSourceId,
    ],
  );
}
