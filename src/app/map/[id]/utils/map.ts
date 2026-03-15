import { MapType } from "@/server/models/MapView";
import mapStyles, { hexMapStyle } from "../styles";
import type { MapViewConfig } from "@/server/models/MapView";

export const getMapStyle = (viewConfig: MapViewConfig) => {
  if (viewConfig.mapType === MapType.Hex) {
    return hexMapStyle;
  }
  return mapStyles[viewConfig.mapStyleName] || Object.values(mapStyles)[0];
};
