import { MapType } from "@/models/MapView";
import mapStyles, { hexMapStyle } from "../styles";
import type { MapViewConfig } from "@/models/MapView";

export const getMapStyle = (viewConfig: MapViewConfig) => {
  if (viewConfig.mapType === MapType.Hex) {
    return hexMapStyle;
  }
  return mapStyles[viewConfig.mapStyleName] || Object.values(mapStyles)[0];
};
