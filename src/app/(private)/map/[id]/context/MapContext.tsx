import { QueryResult } from "@apollo/client";
import { RefObject, createContext } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  AreaSetGroupCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  BoundingBoxInput,
  DataSourcesQuery,
  MapStyleName,
  MapViewConfigInput,
  PlacedMarker,
  Turf,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import { MarkerData } from "@/types";
import { ChoroplethLayerConfig, getChoroplethLayerConfig } from "../sources";
import mapStyles from "../styles";
import { MarkersQueryResult } from "../types";

export class ViewConfig implements MapViewConfigInput {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = AreaSetGroupCode.WMC24;
  public excludeColumnsString = "";
  public markersDataSourceId = "";
  public mapStyleName: MapStyleName = MapStyleName.Light;
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

  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

  /* State */
  boundingBox: BoundingBoxInput | null;
  setBoundingBox: (boundingBox: BoundingBoxInput | null) => void;

  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  placedMarkers: PlacedMarker[];
  placedMarkersLoading: boolean;
  deletePlacedMarker: (id: string) => void;
  insertPlacedMarker: (placedMarker: PlacedMarker) => void;
  updatePlacedMarker: (placedMarker: PlacedMarker) => void;

  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;

  turfs: Turf[];
  turfsLoading: boolean;
  deleteTurf: (id: string) => void;
  insertTurf: (turf: Turf) => void;
  updateTurf: (turf: Turf) => void;

  viewConfig: ViewConfig;
  updateViewConfig: (config: Partial<ViewConfig>) => void;

  viewId: string | null;
  setViewId: (id: string) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  /* GraphQL Queries */
  areaStatsQuery: QueryResult<AreaStatsQuery, AreaStatsQueryVariables> | null;
  dataSourcesQuery: QueryResult<DataSourcesQuery> | null;
  markersQuery: MarkersQueryResult | null;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
}>({
  mapId: null,

  mapRef: null,

  boundingBox: null,
  setBoundingBox: () => null,
  editingTurf: null,
  setEditingTurf: () => null,
  placedMarkers: [],
  placedMarkersLoading: false,
  deletePlacedMarker: () => null,
  insertPlacedMarker: () => null,
  updatePlacedMarker: () => null,
  selectedMarker: null,
  setSelectedMarker: () => null,
  turfs: [],
  turfsLoading: false,
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  viewConfig: new ViewConfig(),
  updateViewConfig: () => null,
  viewId: null,
  setViewId: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,

  areaStatsQuery: null,
  dataSourcesQuery: null,
  markersQuery: null,

  choroplethLayerConfig: getChoroplethLayerConfig(
    AreaSetGroupCode.WMC24,
    DEFAULT_ZOOM,
  ),
});
