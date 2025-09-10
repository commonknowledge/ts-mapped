import { QueryResult } from "@apollo/client";
import { RefObject, createContext } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  AreaSetGroupCode,
  BoundingBoxInput,
  CalculationType,
  ColorScheme,
  MapConfigInput,
  MapQuery,
  MapQueryVariables,
  MapStyleName,
  MapViewConfigInput,
  VisualisationType,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import mapStyles from "../styles";
import { View } from "../types";

export class MapConfig implements MapConfigInput {
  public markerDataSourceIds: string[] = [];
  public membersDataSourceId: string | null = null;

  constructor(params: Partial<MapConfig> = {}) {
    Object.assign(this, params);
  }

  getDataSourceIds() {
    return new Set([this.membersDataSourceId].concat(this.markerDataSourceIds))
      .values()
      .toArray()
      .filter(Boolean);
  }
}

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
  public visualisationType?: VisualisationType | null;

  constructor(params: Partial<ViewConfig> = {}) {
    Object.assign(this, params);
  }

  getExcludeColumns() {
    return this.excludeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
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
  mapConfig: MapConfig;
  updateMapConfig: (config: Partial<MapConfig>) => void;
  saveMapConfig: () => Promise<void>;

  mapName: string | null;
  setMapName: (name: string | null) => void;

  boundingBox: BoundingBoxInput | null;
  setBoundingBox: (boundingBox: BoundingBoxInput | null) => void;

  views: View[];
  deleteView: (viewId: string) => void;
  insertView: (view: Omit<View, "position">) => void;
  updateView: (view: View) => void;
  dirtyViewIds: string[];

  view: View | null;
  setViewId: (id: string) => void;

  viewConfig: ViewConfig;
  updateViewConfig: (config: Partial<ViewConfig>) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  pinDropMode: boolean;
  setPinDropMode: (pinDropMode: boolean) => void;

  ready: boolean;
  setReady: (ready: boolean) => void;

  showControls: boolean;
  setShowControls: (showControls: boolean) => void;

  /* GraphQL Queries */
  mapQuery: QueryResult<MapQuery, MapQueryVariables> | null;
}>({
  mapId: null,
  mapRef: null,
  mapConfig: new MapConfig(),
  updateMapConfig: () => null,
  saveMapConfig: () => Promise.resolve(),
  mapName: null,
  setMapName: () => null,
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
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,
  mapQuery: null,
  pinDropMode: false,
  setPinDropMode: () => null,
  ready: false,
  setReady: () => null,
  showControls: false,
  setShowControls: () => null,
});
