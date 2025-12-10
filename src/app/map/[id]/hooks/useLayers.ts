"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { hiddenLayersAtom } from "../atoms/layerAtoms";
import { useMarkers } from "./useMarkers";
import { useTurfsQuery } from "./useTurfs";
import { useTurfState } from "./useTurfState";

export function useLayers() {
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();
  const { setDataSourceVisibilityState } = useMarkers();
  const { setTurfVisibilityState, visibleTurfs } = useTurfState();

  const [hiddenLayers, setHiddenLayers] = useAtom(hiddenLayersAtom);

  const showLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => prev.filter((l) => l !== layer));

      // TODO: add logic for markers
      if (layer === LayerType.Member) {
        if (mapConfig.membersDataSourceId) {
          setDataSourceVisibilityState(mapConfig.membersDataSourceId, true);
        }
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibilityState(t.id, true));
      }
    },
    [
      setHiddenLayers,
      mapConfig.membersDataSourceId,
      turfs,
      setDataSourceVisibilityState,
      setTurfVisibilityState,
    ],
  );

  const hideLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => [...prev, layer]);

      // TODO: add logic for markers
      if (layer === LayerType.Member) {
        if (mapConfig.membersDataSourceId) {
          setDataSourceVisibilityState(mapConfig.membersDataSourceId, false);
        }
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibilityState(t.id, false));
      }
    },
    [
      setHiddenLayers,
      mapConfig.membersDataSourceId,
      turfs,
      setDataSourceVisibilityState,
      setTurfVisibilityState,
    ],
  );

  const getLayerVisibility = useCallback(
    (layer: LayerType) => {
      if (layer === LayerType.Turf) {
        return Boolean(visibleTurfs?.length) && !hiddenLayers.includes(layer);
      }

      return !hiddenLayers.includes(layer);
    },
    [hiddenLayers, visibleTurfs],
  );

  return {
    hiddenLayers,
    showLayer,
    hideLayer,
    getLayerVisibility,
  };
}
