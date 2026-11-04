"use client";

import { useAdoptViewAreaSettings } from "../../hooks/useAreaSettings";
import { useInspectorLayers } from "../../hooks/useInspectorLayers";
import { useSyncActiveVisualisation } from "../../hooks/useSavedVisualisations";

// Keeps the inspector's sections in line with the Areas list, and gives
// the map its shared Areas list the first time. Mounted once.
export default function LightInspectorSync() {
  useAdoptViewAreaSettings();
  useSyncActiveVisualisation();
  useInspectorLayers({ sync: true });
  return null;
}
