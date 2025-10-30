"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import type { Turf } from "@/server/models/Turf";
import type { LayerType } from "@/types";
import type { Feature } from "geojson";
import type { LngLat } from "mapbox-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

interface PrivateMapStore {
  // Table state
  selectedDataSourceId: string;
  tablePage: number;
  toggleDataSourceId: (dataSourceId: string) => void;
  setTablePage: (page: number) => void;

  // View state
  dirtyViewIds: string[];
  setDirtyViewIds: (callback: (prevIds: string[]) => string[]) => void;

  // Choropleth state
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  // Marker and Turf state
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;
  selectedPlacedMarkerId: string | null;
  setSelectedPlacedMarkerId: (id: string | null) => void;
  searchMarker: Feature | null;
  setSearchMarker: (marker: Feature | null) => void;
  markerVisibility: Record<string, boolean>;
  turfVisibility: Record<string, boolean>;
  dataSourceVisibility: Record<string, boolean>;
  setMarkerVisibilityState: (markerId: string, isVisible: boolean) => void;
  setTurfVisibilityState: (turfId: string, isVisible: boolean) => void;
  setDataSourceVisibilityState: (
    dataSourceId: string,
    isVisible: boolean,
  ) => void;
  getMarkerVisibility: (markerId: string) => boolean;
  getTurfVisibility: (turfId: string) => boolean;
  getDataSourceVisibility: (dataSourceId: string) => boolean;
  hiddenLayers: LayerType[];
  showLayer: (layer: LayerType) => void;
  hideLayer: (layer: LayerType) => void;
  getLayerVisibility: (layer: LayerType) => boolean;

  // Controls
  pinDropMode: boolean;
  setPinDropMode: (pinDropMode: boolean) => void;
  handleAddArea: (mapRef: RefObject<MapRef | null> | null) => void;
  handleDropPin: (
    mapRef: RefObject<MapRef | null> | null,
    callback: (lngLat: LngLat) => void,
  ) => void;
}

export const createPrivateMapStore = () => {
  return createStore<PrivateMapStore>((set, get) => ({
    // Table state
    tablePage: 0,
    setTablePage: (page) => {
      set({ tablePage: page });
    },
    selectedDataSourceId: "",
    toggleDataSourceId: (dataSourceId) => {
      const currentId = get().selectedDataSourceId;
      if (currentId === dataSourceId) {
        set({ selectedDataSourceId: "" });
      } else {
        set({ selectedDataSourceId: dataSourceId, tablePage: 0 });
      }
    },

    // View state
    dirtyViewIds: [],
    setDirtyViewIds: (callback) => {
      set((state) => ({
        dirtyViewIds: callback(state.dirtyViewIds),
      }));
    },

    // Choropleth state
    boundariesPanelOpen: false,
    setBoundariesPanelOpen: (open) => {
      set({ boundariesPanelOpen: open });
    },

    // Marker and Turf state
    editingTurf: null,
    setEditingTurf: (editingTurf) => {
      set({ editingTurf });
    },
    selectedPlacedMarkerId: null,
    setSelectedPlacedMarkerId: (selectedPlacedMarkerId) => {
      set({ selectedPlacedMarkerId });
    },
    searchMarker: null,
    setSearchMarker: (searchMarker) => {
      set({ searchMarker });
    },
    markerVisibility: {},
    turfVisibility: {},
    dataSourceVisibility: {},
    setMarkerVisibilityState: (markerId, isVisible) => {
      set((state) => ({
        markerVisibility: { ...state.markerVisibility, [markerId]: isVisible },
      }));
    },
    setTurfVisibilityState: (turfId, isVisible) => {
      set((state) => ({
        turfVisibility: { ...state.turfVisibility, [turfId]: isVisible },
      }));
    },
    setDataSourceVisibilityState: (dataSourceId, isVisible) => {
      set((state) => ({
        dataSourceVisibility: {
          ...state.dataSourceVisibility,
          [dataSourceId]: isVisible,
        },
      }));
    },
    getMarkerVisibility: (markerId) => {
      return get().markerVisibility[markerId] ?? true;
    },
    getTurfVisibility: (turfId) => {
      return get().turfVisibility[turfId] ?? true;
    },
    getDataSourceVisibility: (dataSourceId) => {
      return get().dataSourceVisibility[dataSourceId] ?? true;
    },
    hiddenLayers: [],
    showLayer: (layer) => {
      set((state) => ({
        hiddenLayers: state.hiddenLayers.filter((l) => l !== layer),
      }));
    },
    hideLayer: (layer) => {
      set((state) => ({
        hiddenLayers: [...state.hiddenLayers, layer],
      }));
    },
    getLayerVisibility: (layer) => {
      return !get().hiddenLayers.includes(layer);
    },

    // Controls
    pinDropMode: false,
    setPinDropMode: (pinDropMode) => {
      set({ pinDropMode });
    },
    handleAddArea: (mapRef) => {
      const map = mapRef?.current;
      if (!map) return;
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) drawButton.click();
    },
    handleDropPin: (mapRef, callback: (lngLat: LngLat) => void) => {
      const map = mapRef?.current;
      if (!map) return;
      set({ pinDropMode: true });
      map.getCanvas().style.cursor = "crosshair";

      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        callback(e.lngLat);
        map.getCanvas().style.cursor = "";
        map.off("click", clickHandler);
        set({ pinDropMode: false });
        map.flyTo({ center: e.lngLat, zoom: 14 });
      };
      map.once("click", clickHandler);
    },
  }));
};

export const PrivateMapStoreContext = createContext<ReturnType<
  typeof createPrivateMapStore
> | null>(null);

export function usePrivateMapStore<T>(
  selector: (state: PrivateMapStore) => T,
): T {
  const store = useContext(PrivateMapStoreContext);
  if (!store) throw new Error("Missing PrivateMapStoreProvider");
  return useStore(store, selector);
}
