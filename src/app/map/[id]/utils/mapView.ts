import {
  ColorScheme,
  DEFAULT_CALCULATION_TYPE,
  MapStyleName,
} from "@/server/models/MapView";
import type { MapViewConfig } from "@/server/models/MapView";

export const createNewViewConfig = (): MapViewConfig => {
  return {
    areaDataSourceId: "",
    areaDataColumn: "",
    areaDataNullIsZero: true,
    areaSetGroupCode: undefined,
    mapStyleName: MapStyleName.Light,
    showLabels: true,
    showBoundaryOutline: false,
    showMembers: true,
    showLocations: true,
    showTurf: true,
    calculationType: DEFAULT_CALCULATION_TYPE,
    colorScheme: ColorScheme.RedBlue,
    reverseColorScheme: false,
  };
};
