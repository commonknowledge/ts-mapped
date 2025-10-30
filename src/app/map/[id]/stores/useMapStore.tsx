"use client";

import { createContext, use } from "react";
import { createStore, useStore } from "zustand";
import { DEFAULT_ZOOM } from "@/constants";
import {
  CalculationType,
  ColorScheme,
  MapStyleName,
} from "@/server/models/MapView";
import mapStyles from "../styles";
import type { ChoroplethLayerConfig } from "../sources";
import type { BoundingBox } from "@/server/models/Area";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { DataSource } from "@/server/models/DataSource";
import type { MapConfig } from "@/server/models/Map";
import type { MapViewConfig } from "@/server/models/MapView";
import type { Turf } from "@/server/models/Turf";
import type { LayerType } from "@/types";
import type { Feature } from "geojson";
import type { Polygon } from "geojson";
import type { LngLat, LngLatLike } from "mapbox-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export interface InspectorContent {
  type: LayerType | undefined;
  name: string | unknown;
  properties: Record<string, unknown> | null;
  dataSource: DataSource | null;
}

export interface SelectedRecord {
  id: string;
  dataSourceId: string;
  point?: LngLatLike | null;
  properties?: Record<string, unknown> | null;
}

export interface SelectedTurf {
  id: string;
  name: string;
  geometry: Polygon;
}

export interface SelectedBoundary {
  id: string;
  areaCode: string;
  areaSetCode: AreaSetCode;
  sourceLayerId: string;
  name: string;
  properties?: Record<string, unknown> | null;
}

interface MapStore {
  // Map state
  mapRef: RefObject<MapRef | null> | null;
  setMapRef: (ref: RefObject<MapRef | null>) => void;
  boundingBox: BoundingBox | null;
  setBoundingBox: (boundingBox: BoundingBox | null) => void;
  viewId: string | null | undefined;
  setViewId: (id: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
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
  lastLoadedSourceId: string | undefined;
  setLastLoadedSourceId: (id: string | undefined) => void;
  choroplethLayerConfig: ChoroplethLayerConfig | null;
  setChoroplethLayerConfig: (config: ChoroplethLayerConfig | null) => void;

  // Table state
  selectedDataSourceId: string;
  tablePage: number;
  toggleDataSourceId: (dataSourceId: string) => void;
  setTablePage: (page: number) => void;

  // View state
  dirtyViewIds: string[];
  setDirtyViewIds: (callback: (prevIds: string[]) => string[]) => void;

  // Choropleth panel state
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

export const createMapStore = ({
  initialViewId,
}: {
  initialViewId?: string;
}) => {
  return createStore<MapStore>((set, get) => ({
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
      set({ viewId });
    },
    zoom: DEFAULT_ZOOM,
    setZoom: (zoom) => {
      set({ zoom });
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
    lastLoadedSourceId: undefined,
    setLastLoadedSourceId: (id) => {
      set({ lastLoadedSourceId: id });
    },
    choroplethLayerConfig: null,
    setChoroplethLayerConfig: (config) => {
      set({ choroplethLayerConfig: config });
    },

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

    // Choropleth panel state
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

export const MapStoreContext = createContext<ReturnType<
  typeof createMapStore
> | null>(null);

export function useMapStore<T>(selector: (state: MapStore) => T): T {
  const store = use(MapStoreContext);
  if (!store) throw new Error("Missing MapStoreProvider");
  return useStore(store, selector);
}

export const createNewViewConfig = (): MapViewConfig => {
  return {
    areaDataSourceId: "",
    areaDataColumn: "",
    areaSetGroupCode: null,
    excludeColumnsString: "",
    mapStyleName: MapStyleName.Light,
    showLabels: true,
    showBoundaryOutline: false,
    showMembers: true,
    showLocations: true,
    showTurf: true,
    calculationType: CalculationType.Value,
    colorScheme: ColorScheme.RedBlue,
    reverseColorScheme: false,
    visualisationType: null,
  };
};

export const getDataSourceIds = (mapConfig: MapConfig) => {
  return Array.from(
    new Set(
      [mapConfig.membersDataSourceId]
        .concat(mapConfig.markerDataSourceIds)
        .filter(Boolean),
    ),
  );
};

export const getMapStyle = (viewConfig: MapViewConfig) => {
  return mapStyles[viewConfig.mapStyleName] || Object.values(mapStyles)[0];
};
