import { createContext } from "react";
import { DEFAULT_ZOOM } from "@/constants";
import { getChoroplethLayerConfig } from "../sources";
import type { ChoroplethLayerConfig } from "../sources";
import type { RouterOutputs } from "@/services/trpc/react";

export const ChoroplethContext = createContext<{
  /* State */
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string) => void;

  /* Queries */
  areaStatsQuery: {
    data: RouterOutputs["area"]["stats"] | undefined;
    isFetching: boolean;
  } | null;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
}>({
  boundariesPanelOpen: false,
  setBoundariesPanelOpen: () => null,
  choroplethLayerConfig: getChoroplethLayerConfig(null, null, DEFAULT_ZOOM),
  lastLoadedSourceId: undefined,
  setLastLoadedSourceId: () => null,

  areaStatsQuery: null,
});
