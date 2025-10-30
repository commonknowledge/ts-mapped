import { createContext } from "react";
import { DEFAULT_ZOOM } from "@/constants";
import { getChoroplethLayerConfig } from "../sources";
import type { ChoroplethLayerConfig } from "../sources";

export const ChoroplethContext = createContext<{
  /* State */
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string) => void;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
}>({
  boundariesPanelOpen: false,
  setBoundariesPanelOpen: () => null,
  choroplethLayerConfig: getChoroplethLayerConfig(null, null, DEFAULT_ZOOM),
  lastLoadedSourceId: undefined,
  setLastLoadedSourceId: () => null,
});
