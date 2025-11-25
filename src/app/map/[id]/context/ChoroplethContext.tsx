import { createContext } from "react";
import { DEFAULT_ZOOM } from "@/constants";
import {
  getChoroplethLayerConfig,
} from "../components/Choropleth/configs";
import type {
  ChoroplethLayerConfig} from "../components/Choropleth/configs";

export const ChoroplethContext = createContext<{
  /* State */
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  selectedBivariateBucket: string | null;
  setSelectedBivariateBucket: (b: string | null) => void;

  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string) => void;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
}>({
  boundariesPanelOpen: false,
  setBoundariesPanelOpen: () => null,
  selectedBivariateBucket: null,
  setSelectedBivariateBucket: () => null,
  choroplethLayerConfig: getChoroplethLayerConfig({
    zoom: DEFAULT_ZOOM,
  }),
  lastLoadedSourceId: undefined,
  setLastLoadedSourceId: () => null,
});
