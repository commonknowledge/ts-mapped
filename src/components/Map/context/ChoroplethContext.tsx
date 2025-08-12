import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import { AreaStatsQuery, AreaStatsQueryVariables } from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import { ChoroplethLayerConfig, getChoroplethLayerConfig } from "../sources";

export const ChoroplethContext = createContext<{
  /* State */
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string) => void;

  /* Queries */
  areaStatsLoading: boolean;
  areaStatsQuery: QueryResult<AreaStatsQuery, AreaStatsQueryVariables> | null;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
}>({
  boundariesPanelOpen: false,
  setBoundariesPanelOpen: () => null,
  choroplethLayerConfig: getChoroplethLayerConfig(null, DEFAULT_ZOOM),
  lastLoadedSourceId: undefined,
  setLastLoadedSourceId: () => null,
  areaStatsLoading: false,
  areaStatsQuery: null,
});
