"use client";

import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { hiddenLayersAtom } from "../atoms/layerAtoms";
import { useMapViews } from "./useMapViews";
import { usePlacedMarkersQuery } from "./usePlacedMarkers";
import { usePlacedMarkerState } from "./usePlacedMarkers";
import { useTurfsQuery } from "./useTurfsQuery";
import { useTurfState } from "./useTurfState";

export function useLayers() {
  const { mapConfig } = useMapConfig();
  const { viewConfig, updateViewConfig } = useMapViews();
  const { data: turfs = [] } = useTurfsQuery();
  const { setTurfVisibility, visibleTurfs } = useTurfState();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { setPlacedMarkerVisibility } = usePlacedMarkerState();
  const [hiddenLayers, setHiddenLayers] = useAtom(hiddenLayersAtom);

  // Saved on the view, so each view keeps its own layers on show
  const hiddenDataSourceIds = useMemo(
    () => viewConfig.hiddenMarkerDataSourceIds ?? [],
    [viewConfig.hiddenMarkerDataSourceIds],
  );

  // One view update for every source, as separate updates in the same tick
  // would each overwrite the last
  const setDataSourcesVisibility = useCallback(
    (dataSourceIds: string[], isVisible: boolean) => {
      const hidden = new Set(hiddenDataSourceIds);
      for (const id of dataSourceIds) {
        if (isVisible) {
          hidden.delete(id);
        } else {
          hidden.add(id);
        }
      }
      const next = [...hidden];
      if (
        next.length === hiddenDataSourceIds.length &&
        next.every((id) => hiddenDataSourceIds.includes(id))
      ) {
        return;
      }
      updateViewConfig({ hiddenMarkerDataSourceIds: next });
    },
    [hiddenDataSourceIds, updateViewConfig],
  );

  const setDataSourceVisibility = useCallback(
    (dataSourceId: string, isVisible: boolean) =>
      setDataSourcesVisibility([dataSourceId], isVisible),
    [setDataSourcesVisibility],
  );

  const getDataSourceVisibility = useCallback(
    (dataSourceId: string) => !hiddenDataSourceIds.includes(dataSourceId),
    [hiddenDataSourceIds],
  );

  // The marker data sources a layer type covers
  const getLayerDataSourceIds = useCallback(
    (layer: LayerType) => {
      const members = mapConfig.membersDataSourceId
        ? [mapConfig.membersDataSourceId]
        : [];
      if (layer === LayerType.Member) return members;
      if (layer === LayerType.Marker) {
        return [...mapConfig.markerDataSourceIds, ...members];
      }
      return [];
    },
    [mapConfig.markerDataSourceIds, mapConfig.membersDataSourceId],
  );

  const showLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => prev.filter((l) => l !== layer));

      if (layer === LayerType.Member || layer === LayerType.Marker) {
        setDataSourcesVisibility(getLayerDataSourceIds(layer), true);
      }
      if (layer === LayerType.Marker) {
        placedMarkers.forEach((marker) =>
          setPlacedMarkerVisibility(marker.id, true),
        );
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibility(t.id, true));
      } else if (layer === LayerType.Boundary) {
        updateViewConfig({ showChoropleth: true });
      }
    },
    [
      getLayerDataSourceIds,
      placedMarkers,
      setDataSourcesVisibility,
      setHiddenLayers,
      setPlacedMarkerVisibility,
      setTurfVisibility,
      turfs,
      updateViewConfig,
    ],
  );

  const hideLayer = useCallback(
    (layer: LayerType) => {
      setHiddenLayers((prev) => [...prev, layer]);

      if (layer === LayerType.Member || layer === LayerType.Marker) {
        setDataSourcesVisibility(getLayerDataSourceIds(layer), false);
      }
      if (layer === LayerType.Marker) {
        placedMarkers.forEach((marker) =>
          setPlacedMarkerVisibility(marker.id, false),
        );
      } else if (layer === LayerType.Turf) {
        turfs.forEach((t) => setTurfVisibility(t.id, false));
      } else if (layer === LayerType.Boundary) {
        updateViewConfig({ showChoropleth: false });
      }
    },
    [
      getLayerDataSourceIds,
      placedMarkers,
      setDataSourcesVisibility,
      setHiddenLayers,
      setPlacedMarkerVisibility,
      setTurfVisibility,
      turfs,
      updateViewConfig,
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
