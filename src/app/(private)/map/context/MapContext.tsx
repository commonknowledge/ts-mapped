import { QueryResult } from "@apollo/client";
import { RefObject, createContext } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  AreaStatsQuery,
  AreaStatsQueryVariables,
  BoundingBoxInput,
  DataSourcesQuery,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import { DrawnPolygon, MarkerData, SearchResult } from "@/types";
import {
  AreaSetGroupCode,
  ChoroplethLayerConfig,
  getChoroplethLayerConfig,
} from "../sources";
import mapStyles, { MapStyle } from "../styles";
import { MarkersQueryResult } from "../types";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public excludeColumnsString = "";
  public markersDataSourceId = "";
  public mapStyle: MapStyle = mapStyles["light-v11"];
  public showLabels = true;
  public showBoundaryOutline = false;
  public showMembers = true;
  public showLocations = true;
  public showTurf = true;

  constructor(params: Partial<MapConfig> = {}) {
    Object.assign(this, params);
  }

  getExcludeColumns() {
    return this.excludeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

export const MapContext = createContext<{
  /* Map Ref */
  mapRef: RefObject<MapRef | null> | null;

  /* State */
  boundingBox: BoundingBoxInput | null;
  setBoundingBox: (boundingBox: BoundingBoxInput | null) => void;

  editingPolygon: DrawnPolygon | null;
  setEditingPolygon: (polygon: DrawnPolygon | null) => void;

  mapConfig: MapConfig;

  searchHistory: SearchResult[];
  setSearchHistory: (
    searchHistory: SearchResult[] | ((prev: SearchResult[]) => SearchResult[]),
  ) => void;

  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;

  turfHistory: DrawnPolygon[];
  setTurfHistory: (
    turfHistory: DrawnPolygon[] | ((prev: DrawnPolygon[]) => DrawnPolygon[]),
  ) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  /* GraphQL Queries */
  areaStatsQuery: QueryResult<AreaStatsQuery, AreaStatsQueryVariables> | null;
  dataSourcesQuery: QueryResult<DataSourcesQuery> | null;
  markersQuery: MarkersQueryResult | null;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
  updateMapConfig: (config: Partial<MapConfig>) => void;
}>({
  mapRef: null,

  boundingBox: null,
  setBoundingBox: () => null,
  editingPolygon: null,
  setEditingPolygon: () => null,
  mapConfig: new MapConfig(),
  searchHistory: [],
  setSearchHistory: () => null,
  selectedMarker: null,
  setSelectedMarker: () => null,
  turfHistory: [],
  setTurfHistory: () => null,
  zoom: DEFAULT_ZOOM,
  setZoom: () => null,

  areaStatsQuery: null,
  dataSourcesQuery: null,
  markersQuery: null,

  choroplethLayerConfig: getChoroplethLayerConfig("WMC24", DEFAULT_ZOOM),
  updateMapConfig: () => null,
});
