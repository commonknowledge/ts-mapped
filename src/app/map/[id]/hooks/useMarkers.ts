"use client";

import { useAtom } from "jotai";
import { useCallback, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import {
  dataSourceVisibilityAtom,
  markerVisibilityAtom,
  searchMarkerAtom,
  selectedPlacedMarkerIdAtom,
} from "../atoms/markerAtoms";
import { usePlacedMarkerMutations } from "./usePlacedMarkers";

export function useMarkers() {
  const { mapRef, mapId, setPinDropMode } = useContext(MapContext);

  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useAtom(
    selectedPlacedMarkerIdAtom,
  );
  const [searchMarker, setSearchMarker] = useAtom(searchMarkerAtom);
  const [markerVisibility, setMarkerVisibility] = useAtom(markerVisibilityAtom);
  const [dataSourceVisibility, setDataSourceVisibility] = useAtom(
    dataSourceVisibilityAtom,
  );

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
    selectedPlacedMarkerId,
    setSelectedPlacedMarkerId,
    searchMarker,
    setSearchMarker,
    handleDropPin,
    markerVisibility,
    dataSourceVisibility,
    setMarkerVisibilityState,
    setDataSourceVisibilityState,
    getMarkerVisibility,
    getDataSourceVisibility,
  };
}
