import { createContext } from "react";
import {
  CalculationType,
  ColorScheme,
  MapStyleName,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import mapStyles from "../styles";
import type { MapViewConfigInput } from "@/__generated__/types";
import type { BoundingBox } from "@/server/models/Area";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";
import type { MapView, VisualisationType } from "@/server/models/MapView";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export class ViewConfig implements MapViewConfigInput {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode | null = null;
  public excludeColumnsString = "";
  public mapStyleName: MapStyleName = MapStyleName.Light;
  public showLabels = true;
  public showBoundaryOutline = false;
  public showMembers = true;
  public showLocations = true;
  public showTurf = true;
  public calculationType?: CalculationType | null = CalculationType.Value;
  public colorScheme?: ColorScheme | null = ColorScheme.RedBlue;
  public reverseColorScheme?: boolean | null | undefined;
  public visualisationType?: VisualisationType | null;

  constructor(params: Partial<ViewConfig> = {}) {
    Object.assign(this, params);
  }

  getMapStyle() {
    return mapStyles[this.mapStyleName] || Object.values(mapStyles)[0];
  }
}

export const MapContext = createContext<{
  /* Map ID from URL */
  mapId: string | null;

  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

  /* State */
  boundingBox: BoundingBox | null;
  setBoundingBox: (boundingBox: BoundingBox | null) => void;

  views: MapView[];
  deleteView: (viewId: string) => void;
  insertView: (view: Omit<MapView, "position">) => void;
  updateView: (view: MapView) => void;
  dirtyViewIds: string[];

  view: MapView | null;
  setViewId: (id: string) => void;

  viewConfig: ViewConfig;
  updateViewConfig: (config: Partial<ViewConfig>) => void;

  configDirty: boolean;
  setConfigDirty: (dirty: boolean) => void;

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
  views: [],
  deleteView: () => null,
  insertView: () => null,
  updateView: () => null,
  dirtyViewIds: [],
  viewConfig: new ViewConfig(),
  updateViewConfig: () => null,
  view: null,
  setViewId: () => null,
  configDirty: false,
  setConfigDirty: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,
  pinDropMode: false,
  setPinDropMode: () => null,
  ready: false,
  setReady: () => null,
  showControls: true,
  setShowControls: () => null,
});
