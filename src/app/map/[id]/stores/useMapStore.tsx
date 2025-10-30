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
import type { LayerType } from "@/types";
import type { Polygon } from "geojson";
import type { LngLatLike } from "mapbox-gl";
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
}

export const createMapStore = ({
  initialViewId,
}: {
  initialViewId?: string;
}) => {
  return createStore<MapStore>((set) => ({
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
