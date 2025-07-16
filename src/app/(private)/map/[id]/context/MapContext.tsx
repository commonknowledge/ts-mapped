import { QueryResult } from "@apollo/client";
import { RefObject, createContext } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  AreaSetGroupCode,
  BoundingBoxInput,
  DataSourcesQuery,
  MapQuery,
  MapQueryVariables,
  MapStyleName,
  MapViewConfigInput,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import mapStyles from "../styles";

export class ViewConfig implements MapViewConfigInput {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode | null = null;
  public excludeColumnsString = "";
  public markerDataSourceIds: string[] = [];
  public membersDataSourceId = "";
  public mapStyleName: MapStyleName = MapStyleName.Light;
  public selectedDataSourceId = "";
  public showLabels = true;
  public showBoundaryOutline = false;
  public showMembers = true;
  public showLocations = true;
  public showTurf = true;

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

  /* Map Name */
  mapName: string | null;
  setMapName: (name: string | null) => void;

  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

  /* State */
  boundingBox: BoundingBoxInput | null;
  setBoundingBox: (boundingBox: BoundingBoxInput | null) => void;

  viewConfig: ViewConfig;
  updateViewConfig: (config: Partial<ViewConfig>) => void;

  viewId: string | null;
  setViewId: (id: string) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  /* GraphQL Queries */
  dataSourcesQuery: QueryResult<DataSourcesQuery> | null;
  mapQuery: QueryResult<MapQuery, MapQueryVariables> | null;
}>({
  mapId: null,
  mapName: null,
  setMapName: () => null,
  mapRef: null,
  boundingBox: null,
  setBoundingBox: () => null,
  viewConfig: new ViewConfig(),
  updateViewConfig: () => null,
  viewId: null,
  setViewId: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,
  dataSourcesQuery: null,
  mapQuery: null,
});
