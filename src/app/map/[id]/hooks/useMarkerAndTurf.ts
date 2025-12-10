"use client";

import { useAtom } from "jotai";
import { useCallback, useContext, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { usePlacedMarkerMutations } from "../hooks/usePlacedMarkers";
import { useTurfsQuery } from "../hooks/useTurfs";
import {
  dataSourceVisibilityAtom,
  editingTurfAtom,
  hiddenLayersAtom,
  markerVisibilityAtom,
  searchMarkerAtom,
  selectedPlacedMarkerIdAtom,
  turfVisibilityAtom,
} from "../atoms/markerAndTurfAtoms";

export function useMarkerAndTurf() {
  const { mapRef, mapId, setPinDropMode } = useContext(MapContext);
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();

  const [editingTurf, setEditingTurf] = useAtom(editingTurfAtom);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useAtom(
    selectedPlacedMarkerIdAtom,
  );
  const [searchMarker, setSearchMarker] = useAtom(searchMarkerAtom);
  const [markerVisibility, setMarkerVisibility] = useAtom(markerVisibilityAtom);
  const [turfVisibility, setTurfVisibility] = useAtom(turfVisibilityAtom);
  const [dataSourceVisibility, setDataSourceVisibility] = useAtom(
    dataSourceVisibilityAtom,
  );
  const [hiddenLayers, setHiddenLayers] = useAtom(hiddenLayersAtom);

  const setMarkerVisibilityState = useCallback(
    (markerId: string, isVisible: boolean) => {
      setMarkerVisibility((prev) => ({ ...prev, [markerId]: isVisible }));
    },
    [setMarkerVisibility],
  );

  const getMarkerVisibility = useCallback(
    (markerId: string) => {
      return markerVisibility[markerId] ?? true; // Default to visible
    },
    [markerVisibility],
  );

  const setTurfVisibilityState = useCallback(
    (turfId: string, isVisible: boolean) => {
      setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
    },
    [setTurfVisibility],
  );

  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const setDataSourceVisibilityState = useCallback(
    (dataSourceId: string, isVisible: boolean) => {
      setDataSourceVisibility((prev) => ({
        ...prev,
        [dataSourceId]: isVisible,
      }));
    },
    [setDataSourceVisibility],
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
          setDataSourceVisibilityState(mapConfig.membersDataSourceId, true);
        }
      } else if (layer === LayerType.Turf) {
        turfs.map((t) => setTurfVisibilityState(t.id, true));
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
        turfs.map((t) => setTurfVisibilityState(t.id, false));
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

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      return getTurfVisibility(turf.id);
    });
  }, [turfs, getTurfVisibility]);

  const getLayerVisibility = useCallback(
    (layer: LayerType) => {
      if (layer === LayerType.Turf) {
        return (
          Boolean(visibleTurfs?.length) && !hiddenLayers.includes(layer)
        );
      }

      return !hiddenLayers.includes(layer);
    },
    [hiddenLayers, visibleTurfs],
  );

  const handleAddArea = useCallback(() => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  }, [mapRef]);

  const { insertPlacedMarker } = usePlacedMarkerMutations();

  const handleDropPin = useCallback(() => {
    const map = mapRef?.current;
    if (!map || !mapId) return;
    setPinDropMode(true);
    map.getCanvas().style.cursor = "crosshair";

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      insertPlacedMarker({
        id: uuidv4(),
        label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
        notes: "",
        point: e.lngLat,
        folderId: null,
      });

      // Reset cursor
      map.getCanvas().style.cursor = "";
      map.off("click", clickHandler);

      setPinDropMode(false);

      // Fly to the new marker
      map.flyTo({
        center: e.lngLat,
        zoom: 14,
      });
    };

    map.once("click", clickHandler);
  }, [mapRef, mapId, setPinDropMode, insertPlacedMarker]);

  return {
    editingTurf,
    setEditingTurf,
    selectedPlacedMarkerId,
    setSelectedPlacedMarkerId,
    visibleTurfs,
    searchMarker,
    setSearchMarker,
    handleAddArea,
    handleDropPin,
    markerVisibility,
    turfVisibility,
    dataSourceVisibility,
    setMarkerVisibilityState,
    setTurfVisibilityState,
    setDataSourceVisibilityState,
    getMarkerVisibility,
    getTurfVisibility,
    getDataSourceVisibility,
    hiddenLayers,
    showLayer,
    hideLayer,
    getLayerVisibility,
  };
}
