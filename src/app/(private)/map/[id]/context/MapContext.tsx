import { QueryResult } from "@apollo/client";
import { RefObject, createContext } from "react";
import { MapRef } from "react-map-gl/mapbox";
import {
  AreaSetGroupCode,
  AreaStatsQuery,
  AreaStatsQueryVariables,
  BoundingBoxInput,
  DataRecordsQuery,
  DataRecordsQueryVariables,
  DataSourcesQuery,
  MapStyleName,
  MapViewConfigInput,
  PlacedMarker,
  SortInput,
  Turf,
} from "@/__generated__/types";
import { DEFAULT_ZOOM } from "@/constants";
import { MarkerData } from "@/types";
import { ChoroplethLayerConfig, getChoroplethLayerConfig } from "../sources";
import mapStyles from "../styles";
import { MarkerQueriesResult } from "../types";

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
  boundariesPanelOpen: boolean;
  setBoundariesPanelOpen: (open: boolean) => void;

  boundingBox: BoundingBoxInput | null;
  setBoundingBox: (boundingBox: BoundingBoxInput | null) => void;

  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  placedMarkers: PlacedMarker[];
  placedMarkersLoading: boolean;
  deletePlacedMarker: (id: string) => void;
  insertPlacedMarker: (placedMarker: PlacedMarker) => void;
  updatePlacedMarker: (placedMarker: PlacedMarker) => void;

  selectedDataSourceId: string;
  handleDataSourceSelect: (dataSourceId: string) => void;

  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;

  tableFilter: string;
  setTableFilter: (filter: string) => void;
  tablePage: number;
  setTablePage: (page: number) => void;
  tableSort: SortInput[];
  setTableSort: (tableSort: SortInput[]) => void;

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
  dataRecordsQuery: QueryResult<
    DataRecordsQuery,
    DataRecordsQueryVariables
  > | null;
  dataSourcesQuery: QueryResult<DataSourcesQuery> | null;
  markerQueries: MarkerQueriesResult | null;

  /* Derived Properties */
  choroplethLayerConfig: ChoroplethLayerConfig;
  selectedRecordId: string | null;
  setSelectedRecordId: (recordId: string | null) => void;
}>({
  mapId: null,
  mapName: null,
  setMapName: () => null,
  mapRef: null,
  boundariesPanelOpen: false,
  setBoundariesPanelOpen: () => null,
  boundingBox: null,
  setBoundingBox: () => null,
  choroplethLayerConfig: getChoroplethLayerConfig(null, DEFAULT_ZOOM),
  editingTurf: null,
  setEditingTurf: () => null,
  placedMarkers: [],
  placedMarkersLoading: false,
  deletePlacedMarker: () => null,
  insertPlacedMarker: () => null,
  updatePlacedMarker: () => null,
  selectedMarker: null,
  setSelectedMarker: () => null,
  tableFilter: "",
  setTableFilter: () => null,
  tablePage: 0,
  setTablePage: () => null,
  tableSort: [],
  setTableSort: () => null,
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
  selectedDataSourceId: "",
  handleDataSourceSelect: () => null,
  selectedRecordId: null,
  setSelectedRecordId: () => null,
  areaStatsQuery: null,
  dataRecordsQuery: null,
  dataSourcesQuery: null,
  markerQueries: null,
});
