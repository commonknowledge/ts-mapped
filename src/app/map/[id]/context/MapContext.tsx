import { createContext } from "react";
import { DEFAULT_ZOOM } from "@/constants";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import {
  CalculationType,
  ColorScheme,
  MapStyleName,
  VisualisationType,
} from "@/server/models/MapView";
import type { BoundingBox } from "@/server/models/Area";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export const MapContext = createContext<{
  /* Map ID from URL */
  mapId: string | null;

  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

  /* State */
  boundingBox: BoundingBox | null;
  setBoundingBox: (boundingBox: BoundingBox | null) => void;

  /* Active View ID */
  viewId: string | null;
  setViewId: (id: string) => void;

  /* Dirty Views Tracking */
  dirtyViewIds: string[];
  setDirtyViewIds: (ids: string[] | ((prev: string[]) => string[])) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  pinDropMode: boolean;
  setPinDropMode: (pinDropMode: boolean) => void;

  ready: boolean;
  setReady: (ready: boolean) => void;

  showControls: boolean;
  setShowControls: (showControls: boolean) => void;
}>({
  mapId: null,
  mapRef: null,
  boundingBox: null,
  setBoundingBox: () => null,
  viewId: null,
  setViewId: () => null,
  dirtyViewIds: [],
  setDirtyViewIds: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,
  pinDropMode: false,
  setPinDropMode: () => null,
  ready: false,
  setReady: () => null,
  showControls: true,
  setShowControls: () => null,
});

export const createNewViewConfig = () => {
  return {
    areaDataSourceId: "",
    areaDataColumn: "",
    areaSetGroupCode: AreaSetGroupCode.WMC24, // Enable Westminster Constituencies by default
    excludeColumnsString: "",
    mapStyleName: MapStyleName.Light,
    showLabels: true,
    showBoundaryOutline: false,
    showMembers: true,
    showLocations: true,
    showTurf: true,
    calculationType: CalculationType.Value,
    colorScheme: ColorScheme.Sequential,
    reverseColorScheme: false,
    visualisationType: VisualisationType.BoundaryOnly, // Enable boundary visualization by default
  };
};
