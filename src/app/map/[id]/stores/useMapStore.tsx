"use client";

import { createContext, use } from "react";
import { createStore, useStore } from "zustand";
import { DEFAULT_ZOOM } from "@/constants";
import type { ChoroplethLayerConfig } from "../sources";
import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
} from "@/app/map/[id]/context/InspectorContext";
import type { BoundingBox } from "@/server/models/Area";
import type { Turf } from "@/server/models/Turf";
import type { LayerType } from "@/types";
import type { Feature } from "geojson";
import type { LngLat } from "mapbox-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

interface MapStore {
  // Table state
  selectedDataSourceId: string;
  tablePage: number;
  toggleDataSourceId: (dataSourceId: string) => void;
  setTablePage: (page: number) => void;

  // Map state
  mapRef: RefObject<MapRef | null> | null;
  setMapRef: (ref: RefObject<MapRef | null>) => void;
  boundingBox: BoundingBox | null;
  setBoundingBox: (boundingBox: BoundingBox | null) => void;
  viewId: string | null | undefined;
  setViewId: (id: string) => void;
  dirtyViewIds: string[];
  setDirtyViewIds: (callback: (prevIds: string[]) => string[]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pinDropMode: boolean;
  setPinDropMode: (pinDropMode: boolean) => void;
  ready: boolean;
  setReady: (ready: boolean) => void;
  showControls: boolean;
  setShowControls: (showControls: boolean) => void;

  // Inspector state
  inspectorContent: InspectorContent | null;
  setInspectorContent: (content: InspectorContent | null) => void;
  selectedRecord: SelectedRecord | null;
  setSelectedRecord: (record: SelectedRecord | null) => void;
  selectedTurf: SelectedTurf | null;
  setSelectedTurf: (turf: SelectedTurf | null) => void;
  selectedBoundary: SelectedBoundary | null;
  setSelectedBoundary: (boundary: SelectedBoundary | null) => void;
  resetInspector: () => void;

  // Choropleth state
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;
  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string | undefined) => void;

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
  handleAddArea: () => void;
  handleDropPin: (callback: (lngLat: LngLat) => void) => void;
  choroplethLayerConfig: ChoroplethLayerConfig | null;
  setChoroplethLayerConfig: (config: ChoroplethLayerConfig | null) => void;
}

export const createMapStore = ({
  initialViewId,
}: {
  initialViewId?: string;
}) => {
  return createStore<MapStore>((set, get) => ({
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

    // Map state
    mapRef: null,
    setMapRef: (mapRef) => {
      set({ mapRef });
    },
    boundingBox: null,
    setBoundingBox: (boundingBox) => {
      set({ boundingBox });
    },
    viewId: initialViewId,
    setViewId: (viewId) => {
      set({ viewId, tablePage: 0 });
    },
    dirtyViewIds: [],
    setDirtyViewIds: (callback) => {
      set((state) => ({
        dirtyViewIds: callback(state.dirtyViewIds),
      }));
    },
    zoom: DEFAULT_ZOOM,
    setZoom: (zoom) => {
      set({ zoom });
    },
    pinDropMode: false,
    setPinDropMode: (pinDropMode) => {
      set({ pinDropMode });
    },
    ready: false,
    setReady: (ready) => {
      set({ ready });
    },
    showControls: true,
    setShowControls: (showControls) => {
      set({ showControls });
    },

    // Inspector state
    inspectorContent: null,
    setInspectorContent: (inspectorContent) => {
      set({ inspectorContent });
    },
    selectedRecord: null,
    setSelectedRecord: (selectedRecord) => {
      set({ selectedRecord });
    },
    selectedTurf: null,
    setSelectedTurf: (selectedTurf) => {
      set({ selectedTurf });
    },
    selectedBoundary: null,
    setSelectedBoundary: (selectedBoundary) => {
      set({ selectedBoundary });
    },
    resetInspector: () => {
      set({
        selectedRecord: null,
        selectedTurf: null,
        selectedBoundary: null,
        inspectorContent: null,
      });
    },

    // Choropleth state
    boundariesPanelOpen: false,
    setBoundariesPanelOpen: (open) => {
      set({ boundariesPanelOpen: open });
    },
    lastLoadedSourceId: undefined,
    setLastLoadedSourceId: (id) => {
      set({ lastLoadedSourceId: id });
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
    handleAddArea: () => {
      const map = get().mapRef?.current;
      if (!map) return;
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) drawButton.click();
    },
    handleDropPin: (callback: (lngLat: LngLat) => void) => {
      const map = get().mapRef?.current;
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
    choroplethLayerConfig: null,
    setChoroplethLayerConfig: (config) => {
      set({ choroplethLayerConfig: config });
    },
  }));
};

export const MapStoreContext = createContext<ReturnType<
  typeof createMapStore
> | null>(null);

export function useMapStore<T>(selector: (state: MapStore) => T): T {
  const store = use(MapStoreContext);
  if (!store) throw new Error("Missing MapStoreProvider");
  return useStore(store, selector);
}
