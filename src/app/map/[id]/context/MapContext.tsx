import {
  CalculationType,
  ColorScheme,
  MapStyleName,
  MapType,
} from "@/server/models/MapView";
import mapStyles, { hexMapStyle } from "../styles";
import type { MapConfig } from "@/server/models/Map";
import type { MapViewConfig } from "@/server/models/MapView";

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
