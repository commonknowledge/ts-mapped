import {
  CalculationType,
  ColorScheme,
  MapStyleName,
} from "@/server/models/MapView";
import type { MapViewConfig } from "@/server/models/MapView";

export const createNewViewConfig = (): MapViewConfig => {
  return {
    areaDataSourceId: "",
    areaDataColumn: "",
    areaDataNullIsZero: true,
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
