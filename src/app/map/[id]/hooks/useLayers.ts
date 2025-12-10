"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { hiddenLayersAtom } from "../atoms/layerAtoms";
import { dataSourceVisibilityAtom } from "../atoms/markerAtoms";
import { useTurfState, useTurfsQuery } from "./useTurfs";

export function useLayers() {
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();
  const { setTurfVisibility, visibleTurfs } = useTurfState();
  const [hiddenLayers, setHiddenLayers] = useAtom(hiddenLayersAtom);

  const [dataSourceVisibility, _setDataSourceVisibility] = useAtom(
    dataSourceVisibilityAtom,
  );

  const setDataSourceVisibility = useCallback(
    (dataSourceId: string, isVisible: boolean) => {
      _setDataSourceVisibility((prev) => ({
        ...prev,
        [dataSourceId]: isVisible,
      }));
    },
    [_setDataSourceVisibility],
  );

  const getDataSourceVisibility = useCallback(
    (dataSourceId: string) => {
      return dataSourceVisibility[dataSourceId] ?? true; // Default to visible
    },
    [dataSourceVisibility],
  );

  const showLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => prev.filter((l) => l !== layer));

      // TODO: add logic for markers
      if (layer === LayerType.Member) {
        if (mapConfig.membersDataSourceId) {
          setDataSourceVisibility(mapConfig.membersDataSourceId, true);
        }
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibility(t.id, true));
      }
    },
    [
      setHiddenLayers,
      mapConfig.membersDataSourceId,
      setDataSourceVisibility,
      turfs,
      setTurfVisibility,
    ],
  );

  const hideLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => [...prev, layer]);

      // TODO: add logic for markers
      if (layer === LayerType.Member) {
        if (mapConfig.membersDataSourceId) {
          setDataSourceVisibility(mapConfig.membersDataSourceId, false);
        }
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibility(t.id, false));
      }
    },
    [
      setHiddenLayers,
      mapConfig.membersDataSourceId,
      setDataSourceVisibility,
      turfs,
      setTurfVisibility,
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
    getDataSourceVisibility,
    setDataSourceVisibility,
  };
}
