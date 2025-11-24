"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useContext, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";
import { usePlacedMarkerMutations } from "../hooks/usePlacedMarkers";
import { useTurfsQuery } from "../hooks/useTurfs";
import type { Turf } from "@/server/models/Turf";
import type { Feature } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ReactNode } from "react";

export default function MarkerAndTurfProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mapRef, mapId, setPinDropMode } = useContext(MapContext);
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();

  /* State */
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useState<
    string | null
  >(null);

  const [searchMarker, setSearchMarker] = useState<Feature | null>(null);

  // Individual visibility states
  const [markerVisibility, setMarkerVisibility] = useState<
    Record<string, boolean>
  >({});
  const setMarkerVisibilityState = (markerId: string, isVisible: boolean) => {
    setMarkerVisibility((prev) => ({ ...prev, [markerId]: isVisible }));
  };
  const getMarkerVisibility = (markerId: string) => {
    return markerVisibility[markerId] ?? true; // Default to visible
  };

  const [turfVisibility, setTurfVisibility] = useState<Record<string, boolean>>(
    {},
  );
  const setTurfVisibilityState = (turfId: string, isVisible: boolean) => {
    setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
  };
  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const [dataSourceVisibility, setDataSourceVisibility] = useState<
    Record<string, boolean>
  >({});
  const setDataSourceVisibilityState = (
    dataSourceId: string,
    isVisible: boolean,
  ) => {
    setDataSourceVisibility((prev) => ({ ...prev, [dataSourceId]: isVisible }));
  };
  const getDataSourceVisibility = (dataSourceId: string) => {
    return dataSourceVisibility[dataSourceId] ?? true; // Default to visible
  };

  const [hiddenLayers, setHiddenLayers] = useState<LayerType[]>([]);

  const showLayer = (layer: LayerType) => {
    setHiddenLayers((prev) => prev.filter((l) => l !== layer));

    // TODO: add logic for markers
    if (layer === LayerType.Member) {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, true);
      }
    } else if (layer === LayerType.Turf) {
      turfs.map((t) => setTurfVisibilityState(t.id, true));
    }
  };

  const hideLayer = (layer: LayerType) => {
    setHiddenLayers((prev) => [...prev, layer]);

    // TODO: add logic for markers
    if (layer === LayerType.Member) {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, false);
      }
    } else if (layer === LayerType.Turf) {
      turfs.map((t) => setTurfVisibilityState(t.id, false));
    }
  };

  const getLayerVisibility = (layer: LayerType) => {
    if (layer === LayerType.Turf) {
      return Boolean(visibleTurfs?.length) && !hiddenLayers.includes(layer);
    }

    return !hiddenLayers.includes(layer);
  };

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      return getTurfVisibility(turf.id);
    });
  }, [turfs, getTurfVisibility]);

  const handleAddArea = () => {
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
  };
  const { insertPlacedMarker } = usePlacedMarkerMutations();

  const handleDropPin = () => {
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
  };

  return (
    <MarkerAndTurfContext
      value={{
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
      }}
    >
      {children}
    </MarkerAndTurfContext>
  );
}
