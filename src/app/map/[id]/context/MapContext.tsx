import { createContext } from "react";
import { DEFAULT_ZOOM } from "@/constants";
import {
  CalculationType,
  ColorScheme,
  MapStyleName,
  MapType,
} from "@/server/models/MapView";
import mapStyles, { hexMapStyle } from "../styles";
import type { MapConfig } from "@/server/models/Map";
import type { MapViewConfig } from "@/server/models/MapView";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export const MapContext = createContext<{
  /* Map ID from URL */
  mapId: string | null;

  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

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

  showControls: boolean;
  setShowControls: (showControls: boolean) => void;
}>({
  mapId: null,
  mapRef: null,
  viewId: null,
  setViewId: () => null,
  dirtyViewIds: [],
  setDirtyViewIds: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,
  pinDropMode: false,
  setPinDropMode: () => null,
  showControls: true,
  setShowControls: () => null,
});

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
    calculationType: CalculationType.Avg,
    colorScheme: ColorScheme.RedBlue,
    reverseColorScheme: false,
  };
};

export const getDataSourceIds = (mapConfig: MapConfig) => {
  return new Set(
    [mapConfig.membersDataSourceId]
      .concat(mapConfig.markerDataSourceIds)
      .filter(Boolean),
  )
    .values()
    .toArray();
};

export const getMapStyle = (viewConfig: MapViewConfig) => {
  if (viewConfig.mapType === MapType.Hex) {
    return hexMapStyle;
  }
  return mapStyles[viewConfig.mapStyleName] || Object.values(mapStyles)[0];
};
