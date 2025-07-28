import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql";
import { GraphQLContext } from "../app/api/graphql/context";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: any; output: any };
  JSON: { input: any; output: any };
};

export enum AreaSetCode {
  MSOA21 = "MSOA21",
  OA21 = "OA21",
  PC = "PC",
  WMC24 = "WMC24",
}

export enum AreaSetGroupCode {
  OA21 = "OA21",
  WMC24 = "WMC24",
}

export type AreaStat = {
  __typename?: "AreaStat";
  areaCode: Scalars["String"]["output"];
  value: Scalars["JSON"]["output"];
};

export type AreaStats = {
  __typename?: "AreaStats";
  column: Scalars["String"]["output"];
  columnType: ColumnType;
  stats: Array<AreaStat>;
};

export type ArgNames = {
  dataSourceIdArg?: InputMaybe<Scalars["String"]["input"]>;
  mapIdArg?: InputMaybe<Scalars["String"]["input"]>;
  organisationIdArg?: InputMaybe<Scalars["String"]["input"]>;
};

export type BoundingBoxInput = {
  east: Scalars["Float"]["input"];
  north: Scalars["Float"]["input"];
  south: Scalars["Float"]["input"];
  west: Scalars["Float"]["input"];
};

export type ColumnDef = {
  __typename?: "ColumnDef";
  name: Scalars["String"]["output"];
  type: ColumnType;
};

export type ColumnRoles = {
  __typename?: "ColumnRoles";
  nameColumn?: Maybe<Scalars["String"]["output"]>;
};

export type ColumnRolesInput = {
  nameColumn: Scalars["String"]["input"];
};

export enum ColumnType {
  Boolean = "Boolean",
  Empty = "Empty",
  Number = "Number",
  Object = "Object",
  String = "String",
  Unknown = "Unknown",
}

export type CreateDataSourceResponse = {
  __typename?: "CreateDataSourceResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<DataSource>;
};

export type CreateMapResponse = {
  __typename?: "CreateMapResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Map>;
};

export type DataRecord = {
  __typename?: "DataRecord";
  externalId: Scalars["String"]["output"];
  geocodePoint?: Maybe<Point>;
  id: Scalars["String"]["output"];
  json: Scalars["JSON"]["output"];
};

export type DataSource = {
  __typename?: "DataSource";
  autoEnrich: Scalars["Boolean"]["output"];
  autoImport: Scalars["Boolean"]["output"];
  columnDefs: Array<ColumnDef>;
  columnRoles: ColumnRoles;
  config: Scalars["JSON"]["output"];
  createdAt: Scalars["Date"]["output"];
  enrichmentDataSources?: Maybe<Array<EnrichmentDataSource>>;
  enrichmentInfo?: Maybe<JobInfo>;
  enrichments: Array<LooseEnrichment>;
  geocodingConfig: LooseGeocodingConfig;
  id: Scalars["String"]["output"];
  importInfo?: Maybe<JobInfo>;
  name: Scalars["String"]["output"];
  recordCount?: Maybe<Scalars["Int"]["output"]>;
  records?: Maybe<Array<DataRecord>>;
};

export type DataSourceRecordCountArgs = {
  filter?: InputMaybe<Scalars["String"]["input"]>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DataSourceRecordsArgs = {
  filter?: InputMaybe<Scalars["String"]["input"]>;
  page?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DataSourceEvent = {
  __typename?: "DataSourceEvent";
  dataSourceId: Scalars["String"]["output"];
  enrichmentComplete?: Maybe<JobCompleteEvent>;
  enrichmentFailed?: Maybe<JobFailedEvent>;
  importComplete?: Maybe<JobCompleteEvent>;
  importFailed?: Maybe<JobFailedEvent>;
  recordsEnriched?: Maybe<RecordsProcessedEvent>;
  recordsImported?: Maybe<RecordsProcessedEvent>;
};

/**
 * Used to display a list of connected sources
 * in the data source dashboard.
 */
export type EnrichmentDataSource = {
  __typename?: "EnrichmentDataSource";
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
};

export enum EnrichmentSourceType {
  Area = "Area",
  DataSource = "DataSource",
}

export type Folder = {
  __typename?: "Folder";
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  notes: Scalars["String"]["output"];
  position: Scalars["Float"]["output"];
};

export enum GeocodingType {
  Address = "Address",
  Code = "Code",
  Name = "Name",
  None = "None",
}

export type JobCompleteEvent = {
  __typename?: "JobCompleteEvent";
  at: Scalars["String"]["output"];
};

export type JobFailedEvent = {
  __typename?: "JobFailedEvent";
  at: Scalars["String"]["output"];
};

export type JobInfo = {
  __typename?: "JobInfo";
  lastCompleted?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<JobStatus>;
};

export enum JobStatus {
  Complete = "Complete",
  Failed = "Failed",
  None = "None",
  Pending = "Pending",
  Running = "Running",
}

export type LooseEnrichment = {
  __typename?: "LooseEnrichment";
  areaProperty?: Maybe<Scalars["String"]["output"]>;
  areaSetCode?: Maybe<AreaSetCode>;
  dataSourceColumn?: Maybe<Scalars["String"]["output"]>;
  dataSourceId?: Maybe<Scalars["String"]["output"]>;
  sourceType: EnrichmentSourceType;
};

export type LooseEnrichmentInput = {
  areaProperty?: InputMaybe<Scalars["String"]["input"]>;
  areaSetCode?: InputMaybe<AreaSetCode>;
  dataSourceColumn?: InputMaybe<Scalars["String"]["input"]>;
  dataSourceId?: InputMaybe<Scalars["String"]["input"]>;
  sourceType: EnrichmentSourceType;
};

/**
 * GraphQL doesn't have discriminated union types like Typescript.
 * Instead, Loose types contain all possible properties, and data
 * should be validated with the corresponding Zod type before use.
 */
export type LooseGeocodingConfig = {
  __typename?: "LooseGeocodingConfig";
  areaSetCode?: Maybe<AreaSetCode>;
  column?: Maybe<Scalars["String"]["output"]>;
  type: GeocodingType;
};

export type LooseGeocodingConfigInput = {
  areaSetCode?: InputMaybe<AreaSetCode>;
  column?: InputMaybe<Scalars["String"]["input"]>;
  type: GeocodingType;
};

export type Map = {
  __typename?: "Map";
  config: MapConfig;
  createdAt: Scalars["Date"]["output"];
  folders?: Maybe<Array<Folder>>;
  id: Scalars["String"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  placedMarkers?: Maybe<Array<PlacedMarker>>;
  turfs?: Maybe<Array<Turf>>;
  views?: Maybe<Array<MapView>>;
};

export type MapConfig = {
  __typename?: "MapConfig";
  markerDataSourceIds: Array<Scalars["String"]["output"]>;
  membersDataSourceId: Scalars["String"]["output"];
};

export type MapConfigInput = {
  markerDataSourceIds?: InputMaybe<
    Array<InputMaybe<Scalars["String"]["input"]>>
  >;
  membersDataSourceId?: InputMaybe<Scalars["String"]["input"]>;
};

export type MapInput = {
  imageUrl?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export enum MapStyleName {
  Dark = "Dark",
  Light = "Light",
  Satellite = "Satellite",
  Streets = "Streets",
}

export type MapView = {
  __typename?: "MapView";
  config: MapViewConfig;
  id: Scalars["String"]["output"];
  mapId: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  position: Scalars["Float"]["output"];
};

export type MapViewConfig = {
  __typename?: "MapViewConfig";
  areaDataColumn: Scalars["String"]["output"];
  areaDataSourceId: Scalars["String"]["output"];
  areaSetGroupCode?: Maybe<AreaSetGroupCode>;
  excludeColumnsString: Scalars["String"]["output"];
  mapStyleName: MapStyleName;
  showBoundaryOutline: Scalars["Boolean"]["output"];
  showLabels: Scalars["Boolean"]["output"];
  showLocations: Scalars["Boolean"]["output"];
  showMembers: Scalars["Boolean"]["output"];
  showTurf: Scalars["Boolean"]["output"];
};

export type MapViewConfigInput = {
  areaDataColumn?: InputMaybe<Scalars["String"]["input"]>;
  areaDataSourceId?: InputMaybe<Scalars["String"]["input"]>;
  areaSetGroupCode?: InputMaybe<AreaSetGroupCode>;
  excludeColumnsString?: InputMaybe<Scalars["String"]["input"]>;
  mapStyleName?: InputMaybe<MapStyleName>;
  showBoundaryOutline?: InputMaybe<Scalars["Boolean"]["input"]>;
  showLabels?: InputMaybe<Scalars["Boolean"]["input"]>;
  showLocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  showMembers?: InputMaybe<Scalars["Boolean"]["input"]>;
  showTurf?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MapViewInput = {
  config: MapViewConfigInput;
  id: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  position: Scalars["Float"]["input"];
};

export type Mutation = {
  __typename?: "Mutation";
  createDataSource?: Maybe<CreateDataSourceResponse>;
  createMap?: Maybe<CreateMapResponse>;
  deleteFolder?: Maybe<MutationResponse>;
  deleteMap?: Maybe<MutationResponse>;
  deletePlacedMarker?: Maybe<MutationResponse>;
  deleteTurf?: Maybe<MutationResponse>;
  enqueueEnrichDataSourceJob?: Maybe<MutationResponse>;
  enqueueImportDataSourceJob?: Maybe<MutationResponse>;
  updateDataSourceConfig?: Maybe<MutationResponse>;
  updateMap?: Maybe<UpdateMapResponse>;
  updateMapConfig?: Maybe<UpdateMapConfigResponse>;
  upsertFolder?: Maybe<UpsertFolderResponse>;
  upsertPlacedMarker?: Maybe<UpsertPlacedMarkerResponse>;
  upsertTurf?: Maybe<UpsertTurfResponse>;
};

export type MutationCreateDataSourceArgs = {
  name: Scalars["String"]["input"];
  organisationId: Scalars["String"]["input"];
  rawConfig: Scalars["JSON"]["input"];
};

export type MutationCreateMapArgs = {
  organisationId: Scalars["String"]["input"];
};

export type MutationDeleteFolderArgs = {
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
};

export type MutationDeleteMapArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeletePlacedMarkerArgs = {
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
};

export type MutationDeleteTurfArgs = {
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
};

export type MutationEnqueueEnrichDataSourceJobArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type MutationEnqueueImportDataSourceJobArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type MutationUpdateDataSourceConfigArgs = {
  autoEnrich?: InputMaybe<Scalars["Boolean"]["input"]>;
  autoImport?: InputMaybe<Scalars["Boolean"]["input"]>;
  columnRoles?: InputMaybe<ColumnRolesInput>;
  id: Scalars["String"]["input"];
  looseEnrichments?: InputMaybe<Array<LooseEnrichmentInput>>;
  looseGeocodingConfig?: InputMaybe<LooseGeocodingConfigInput>;
};

export type MutationUpdateMapArgs = {
  id: Scalars["String"]["input"];
  map: MapInput;
};

export type MutationUpdateMapConfigArgs = {
  mapConfig: MapConfigInput;
  mapId: Scalars["String"]["input"];
  views: Array<MapViewInput>;
};

export type MutationUpsertFolderArgs = {
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  position: Scalars["Float"]["input"];
};

export type MutationUpsertPlacedMarkerArgs = {
  folderId?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["String"]["input"];
  label: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  point: PointInput;
  position: Scalars["Float"]["input"];
};

export type MutationUpsertTurfArgs = {
  area: Scalars["Float"]["input"];
  createdAt: Scalars["Date"]["input"];
  geometry: Scalars["JSON"]["input"];
  id?: InputMaybe<Scalars["String"]["input"]>;
  label: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
};

export type MutationResponse = {
  __typename?: "MutationResponse";
  code: Scalars["Int"]["output"];
};

export enum Operation {
  AVG = "AVG",
  SUM = "SUM",
}

export type Organisation = {
  __typename?: "Organisation";
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
};

export type PlacedMarker = {
  __typename?: "PlacedMarker";
  folderId?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
  notes: Scalars["String"]["output"];
  point: Point;
  position: Scalars["Float"]["output"];
};

export type Point = {
  __typename?: "Point";
  lat: Scalars["Float"]["output"];
  lng: Scalars["Float"]["output"];
};

export type PointInput = {
  lat: Scalars["Float"]["input"];
  lng: Scalars["Float"]["input"];
};

export type Query = {
  __typename?: "Query";
  areaStats?: Maybe<AreaStats>;
  dataSource?: Maybe<DataSource>;
  dataSources?: Maybe<Array<DataSource>>;
  map?: Maybe<Map>;
  maps?: Maybe<Array<Map>>;
  organisations?: Maybe<Array<Organisation>>;
};

export type QueryAreaStatsArgs = {
  areaSetCode: AreaSetCode;
  boundingBox?: InputMaybe<BoundingBoxInput>;
  column: Scalars["String"]["input"];
  dataSourceId: Scalars["String"]["input"];
  excludeColumns: Array<Scalars["String"]["input"]>;
  operation: Operation;
};

export type QueryDataSourceArgs = {
  id: Scalars["String"]["input"];
};

export type QueryDataSourcesArgs = {
  organisationId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryMapArgs = {
  id: Scalars["String"]["input"];
};

export type QueryMapsArgs = {
  organisationId: Scalars["String"]["input"];
};

export type RecordsProcessedEvent = {
  __typename?: "RecordsProcessedEvent";
  at: Scalars["String"]["output"];
  count: Scalars["Int"]["output"];
};

export type SortInput = {
  desc: Scalars["Boolean"]["input"];
  name: Scalars["String"]["input"];
};

export type Subscription = {
  __typename?: "Subscription";
  dataSourceEvent?: Maybe<DataSourceEvent>;
};

export type SubscriptionDataSourceEventArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type Turf = {
  __typename?: "Turf";
  area: Scalars["Float"]["output"];
  createdAt: Scalars["Date"]["output"];
  geometry: Scalars["JSON"]["output"];
  id: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
  notes: Scalars["String"]["output"];
};

export type UpdateMapConfigResponse = {
  __typename?: "UpdateMapConfigResponse";
  code: Scalars["Int"]["output"];
};

export type UpdateMapResponse = {
  __typename?: "UpdateMapResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Map>;
};

export type UpsertFolderResponse = {
  __typename?: "UpsertFolderResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Folder>;
};

export type UpsertMapViewResponse = {
  __typename?: "UpsertMapViewResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Scalars["String"]["output"]>;
};

export type UpsertPlacedMarkerResponse = {
  __typename?: "UpsertPlacedMarkerResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<PlacedMarker>;
};

export type UpsertTurfResponse = {
  __typename?: "UpsertTurfResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Turf>;
};

export type CreateMapMutationVariables = Exact<{
  organisationId: Scalars["String"]["input"];
}>;

export type CreateMapMutation = {
  __typename?: "Mutation";
  createMap?: {
    __typename?: "CreateMapResponse";
    code: number;
    result?: { __typename?: "Map"; id: string } | null;
  } | null;
};

export type ListMapsQueryVariables = Exact<{
  organisationId: Scalars["String"]["input"];
}>;

export type ListMapsQuery = {
  __typename?: "Query";
  maps?: Array<{
    __typename?: "Map";
    id: string;
    name: string;
    createdAt: any;
    imageUrl?: string | null;
  }> | null;
};

export type EnqueueImportDataSourceJobMutationVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type EnqueueImportDataSourceJobMutation = {
  __typename?: "Mutation";
  enqueueImportDataSourceJob?: {
    __typename?: "MutationResponse";
    code: number;
  } | null;
};

export type DataSourceEventSubscriptionVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type DataSourceEventSubscription = {
  __typename?: "Subscription";
  dataSourceEvent?: {
    __typename?: "DataSourceEvent";
    importComplete?: { __typename?: "JobCompleteEvent"; at: string } | null;
    importFailed?: { __typename?: "JobFailedEvent"; at: string } | null;
    recordsImported?: {
      __typename?: "RecordsProcessedEvent";
      count: number;
    } | null;
  } | null;
};

export type EnqueueEnrichDataSourceJobMutationVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type EnqueueEnrichDataSourceJobMutation = {
  __typename?: "Mutation";
  enqueueEnrichDataSourceJob?: {
    __typename?: "MutationResponse";
    code: number;
  } | null;
};

export type DataSourceEnrichmentEventSubscriptionVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type DataSourceEnrichmentEventSubscription = {
  __typename?: "Subscription";
  dataSourceEvent?: {
    __typename?: "DataSourceEvent";
    enrichmentComplete?: { __typename?: "JobCompleteEvent"; at: string } | null;
    enrichmentFailed?: { __typename?: "JobFailedEvent"; at: string } | null;
    recordsEnriched?: {
      __typename?: "RecordsProcessedEvent";
      count: number;
    } | null;
  } | null;
};

export type UpdateDataSourceConfigMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  columnRoles: ColumnRolesInput;
  looseGeocodingConfig?: InputMaybe<LooseGeocodingConfigInput>;
  autoImport: Scalars["Boolean"]["input"];
}>;

export type UpdateDataSourceConfigMutation = {
  __typename?: "Mutation";
  updateDataSourceConfig?: {
    __typename?: "MutationResponse";
    code: number;
  } | null;
};

export type DataSourceConfigQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DataSourceConfigQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
    autoImport: boolean;
    config: any;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnRoles: { __typename?: "ColumnRoles"; nameColumn?: string | null };
    geocodingConfig: {
      __typename?: "LooseGeocodingConfig";
      type: GeocodingType;
      column?: string | null;
      areaSetCode?: AreaSetCode | null;
    };
  } | null;
};

export type UpdateDataSourceEnrichmentMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  looseEnrichments?: InputMaybe<
    Array<LooseEnrichmentInput> | LooseEnrichmentInput
  >;
}>;

export type UpdateDataSourceEnrichmentMutation = {
  __typename?: "Mutation";
  updateDataSourceConfig?: {
    __typename?: "MutationResponse";
    code: number;
  } | null;
};

export type DataSourceEnrichmentQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DataSourceEnrichmentQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
    enrichments: Array<{
      __typename?: "LooseEnrichment";
      sourceType: EnrichmentSourceType;
      areaSetCode?: AreaSetCode | null;
      areaProperty?: string | null;
      dataSourceId?: string | null;
      dataSourceColumn?: string | null;
    }>;
  } | null;
  dataSources?: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    columnDefs: Array<{ __typename?: "ColumnDef"; name: string }>;
  }> | null;
};

export type DataSourceQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DataSourceQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
    autoEnrich: boolean;
    autoImport: boolean;
    config: any;
    recordCount?: number | null;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnRoles: { __typename?: "ColumnRoles"; nameColumn?: string | null };
    enrichments: Array<{
      __typename?: "LooseEnrichment";
      sourceType: EnrichmentSourceType;
      areaSetCode?: AreaSetCode | null;
      areaProperty?: string | null;
      dataSourceId?: string | null;
      dataSourceColumn?: string | null;
    }>;
    enrichmentDataSources?: Array<{
      __typename?: "EnrichmentDataSource";
      id: string;
      name: string;
    }> | null;
    geocodingConfig: {
      __typename?: "LooseGeocodingConfig";
      type: GeocodingType;
      column?: string | null;
      areaSetCode?: AreaSetCode | null;
    };
    enrichmentInfo?: {
      __typename?: "JobInfo";
      lastCompleted?: string | null;
      status?: JobStatus | null;
    } | null;
    importInfo?: {
      __typename?: "JobInfo";
      lastCompleted?: string | null;
      status?: JobStatus | null;
    } | null;
  } | null;
};

export type CreateDataSourceMutationVariables = Exact<{
  name: Scalars["String"]["input"];
  organisationId: Scalars["String"]["input"];
  rawConfig: Scalars["JSON"]["input"];
}>;

export type CreateDataSourceMutation = {
  __typename?: "Mutation";
  createDataSource?: {
    __typename?: "CreateDataSourceResponse";
    code: number;
    result?: { __typename?: "DataSource"; id: string } | null;
  } | null;
};

export type ListDataSourcesQueryVariables = Exact<{
  organisationId?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ListDataSourcesQuery = {
  __typename?: "Query";
  dataSources?: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    config: any;
    createdAt: any;
  }> | null;
};

export type UpdateMapNameMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  mapInput: MapInput;
}>;

export type UpdateMapNameMutation = {
  __typename?: "Mutation";
  updateMap?: {
    __typename?: "UpdateMapResponse";
    code: number;
    result?: { __typename?: "Map"; id: string; name: string } | null;
  } | null;
};

export type UpdateMapImageMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  mapInput: MapInput;
}>;

export type UpdateMapImageMutation = {
  __typename?: "Mutation";
  updateMap?: {
    __typename?: "UpdateMapResponse";
    code: number;
    result?: {
      __typename?: "Map";
      id: string;
      imageUrl?: string | null;
    } | null;
  } | null;
};

export type DataSourcesQueryVariables = Exact<{ [key: string]: never }>;

export type DataSourcesQuery = {
  __typename?: "Query";
  dataSources?: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    config: any;
    recordCount?: number | null;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
  }> | null;
};

export type DataRecordsQueryVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
  filter: Scalars["String"]["input"];
  page: Scalars["Int"]["input"];
  sort: Array<SortInput> | SortInput;
}>;

export type DataRecordsQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
    recordCount?: number | null;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    records?: Array<{
      __typename?: "DataRecord";
      id: string;
      externalId: string;
      json: any;
      geocodePoint?: { __typename?: "Point"; lat: number; lng: number } | null;
    }> | null;
  } | null;
};

export type MapQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type MapQuery = {
  __typename?: "Query";
  map?: {
    __typename?: "Map";
    name: string;
    config: {
      __typename?: "MapConfig";
      markerDataSourceIds: Array<string>;
      membersDataSourceId: string;
    };
    folders?: Array<{
      __typename?: "Folder";
      id: string;
      name: string;
      notes: string;
      position: number;
    }> | null;
    placedMarkers?: Array<{
      __typename?: "PlacedMarker";
      id: string;
      label: string;
      notes: string;
      folderId?: string | null;
      position: number;
      point: { __typename?: "Point"; lat: number; lng: number };
    }> | null;
    turfs?: Array<{
      __typename?: "Turf";
      id: string;
      label: string;
      notes: string;
      area: number;
      geometry: any;
      createdAt: any;
    }> | null;
    views?: Array<{
      __typename?: "MapView";
      id: string;
      name: string;
      position: number;
      config: {
        __typename?: "MapViewConfig";
        areaDataSourceId: string;
        areaDataColumn: string;
        areaSetGroupCode?: AreaSetGroupCode | null;
        excludeColumnsString: string;
        mapStyleName: MapStyleName;
        showBoundaryOutline: boolean;
        showLabels: boolean;
        showLocations: boolean;
        showMembers: boolean;
        showTurf: boolean;
      };
    }> | null;
  } | null;
};

export type AreaStatsQueryVariables = Exact<{
  areaSetCode: AreaSetCode;
  dataSourceId: Scalars["String"]["input"];
  column: Scalars["String"]["input"];
  operation: Operation;
  excludeColumns:
    | Array<Scalars["String"]["input"]>
    | Scalars["String"]["input"];
  boundingBox?: InputMaybe<BoundingBoxInput>;
}>;

export type AreaStatsQuery = {
  __typename?: "Query";
  areaStats?: {
    __typename?: "AreaStats";
    column: string;
    columnType: ColumnType;
    stats: Array<{ __typename?: "AreaStat"; areaCode: string; value: any }>;
  } | null;
};

export type UpdateMapConfigMutationVariables = Exact<{
  mapId: Scalars["String"]["input"];
  mapConfig: MapConfigInput;
  views: Array<MapViewInput> | MapViewInput;
}>;

export type UpdateMapConfigMutation = {
  __typename?: "Mutation";
  updateMapConfig?: {
    __typename?: "UpdateMapConfigResponse";
    code: number;
  } | null;
};

export type DeleteFolderMutationMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
}>;

export type DeleteFolderMutationMutation = {
  __typename?: "Mutation";
  deleteFolder?: { __typename?: "MutationResponse"; code: number } | null;
};

export type UpsertFolderMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
  position: Scalars["Float"]["input"];
}>;

export type UpsertFolderMutation = {
  __typename?: "Mutation";
  upsertFolder?: {
    __typename?: "UpsertFolderResponse";
    code: number;
    result?: { __typename?: "Folder"; id: string } | null;
  } | null;
};

export type DeletePlacedMarkerMutationMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
}>;

export type DeletePlacedMarkerMutationMutation = {
  __typename?: "Mutation";
  deletePlacedMarker?: { __typename?: "MutationResponse"; code: number } | null;
};

export type UpsertPlacedMarkerMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  label: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  point: PointInput;
  mapId: Scalars["String"]["input"];
  folderId?: InputMaybe<Scalars["String"]["input"]>;
  position: Scalars["Float"]["input"];
}>;

export type UpsertPlacedMarkerMutation = {
  __typename?: "Mutation";
  upsertPlacedMarker?: {
    __typename?: "UpsertPlacedMarkerResponse";
    code: number;
    result?: { __typename?: "PlacedMarker"; id: string } | null;
  } | null;
};

export type DeleteTurfMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
}>;

export type DeleteTurfMutation = {
  __typename?: "Mutation";
  deleteTurf?: { __typename?: "MutationResponse"; code: number } | null;
};

export type UpsertTurfMutationVariables = Exact<{
  id?: InputMaybe<Scalars["String"]["input"]>;
  label: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  area: Scalars["Float"]["input"];
  geometry: Scalars["JSON"]["input"];
  createdAt: Scalars["Date"]["input"];
  mapId: Scalars["String"]["input"];
}>;

export type UpsertTurfMutation = {
  __typename?: "Mutation";
  upsertTurf?: {
    __typename?: "UpsertTurfResponse";
    code: number;
    result?: { __typename?: "Turf"; id: string } | null;
  } | null;
};

export type ListOrganisationsQueryVariables = Exact<{ [key: string]: never }>;

export type ListOrganisationsQuery = {
  __typename?: "Query";
  organisations?: Array<{
    __typename?: "Organisation";
    id: string;
    name: string;
  }> | null;
};

export type DeleteMapMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DeleteMapMutation = {
  __typename?: "Mutation";
  deleteMap?: { __typename?: "MutationResponse"; code: number } | null;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AreaSetCode: AreaSetCode;
  AreaSetGroupCode: AreaSetGroupCode;
  AreaStat: ResolverTypeWrapper<AreaStat>;
  AreaStats: ResolverTypeWrapper<AreaStats>;
  ArgNames: ArgNames;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  BoundingBoxInput: BoundingBoxInput;
  ColumnDef: ResolverTypeWrapper<ColumnDef>;
  ColumnRoles: ResolverTypeWrapper<ColumnRoles>;
  ColumnRolesInput: ColumnRolesInput;
  ColumnType: ColumnType;
  CreateDataSourceResponse: ResolverTypeWrapper<CreateDataSourceResponse>;
  CreateMapResponse: ResolverTypeWrapper<CreateMapResponse>;
  DataRecord: ResolverTypeWrapper<DataRecord>;
  DataSource: ResolverTypeWrapper<DataSource>;
  DataSourceEvent: ResolverTypeWrapper<DataSourceEvent>;
  Date: ResolverTypeWrapper<Scalars["Date"]["output"]>;
  EnrichmentDataSource: ResolverTypeWrapper<EnrichmentDataSource>;
  EnrichmentSourceType: EnrichmentSourceType;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  Folder: ResolverTypeWrapper<Folder>;
  GeocodingType: GeocodingType;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  JobCompleteEvent: ResolverTypeWrapper<JobCompleteEvent>;
  JobFailedEvent: ResolverTypeWrapper<JobFailedEvent>;
  JobInfo: ResolverTypeWrapper<JobInfo>;
  JobStatus: JobStatus;
  LooseEnrichment: ResolverTypeWrapper<LooseEnrichment>;
  LooseEnrichmentInput: LooseEnrichmentInput;
  LooseGeocodingConfig: ResolverTypeWrapper<LooseGeocodingConfig>;
  LooseGeocodingConfigInput: LooseGeocodingConfigInput;
  Map: ResolverTypeWrapper<Map>;
  MapConfig: ResolverTypeWrapper<MapConfig>;
  MapConfigInput: MapConfigInput;
  MapInput: MapInput;
  MapStyleName: MapStyleName;
  MapView: ResolverTypeWrapper<MapView>;
  MapViewConfig: ResolverTypeWrapper<MapViewConfig>;
  MapViewConfigInput: MapViewConfigInput;
  MapViewInput: MapViewInput;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponse: ResolverTypeWrapper<MutationResponse>;
  Operation: Operation;
  Organisation: ResolverTypeWrapper<Organisation>;
  PlacedMarker: ResolverTypeWrapper<PlacedMarker>;
  Point: ResolverTypeWrapper<Point>;
  PointInput: PointInput;
  Query: ResolverTypeWrapper<{}>;
  RecordsProcessedEvent: ResolverTypeWrapper<RecordsProcessedEvent>;
  SortInput: SortInput;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  Subscription: ResolverTypeWrapper<{}>;
  Turf: ResolverTypeWrapper<Turf>;
  UpdateMapConfigResponse: ResolverTypeWrapper<UpdateMapConfigResponse>;
  UpdateMapResponse: ResolverTypeWrapper<UpdateMapResponse>;
  UpsertFolderResponse: ResolverTypeWrapper<UpsertFolderResponse>;
  UpsertMapViewResponse: ResolverTypeWrapper<UpsertMapViewResponse>;
  UpsertPlacedMarkerResponse: ResolverTypeWrapper<UpsertPlacedMarkerResponse>;
  UpsertTurfResponse: ResolverTypeWrapper<UpsertTurfResponse>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AreaStat: AreaStat;
  AreaStats: AreaStats;
  ArgNames: ArgNames;
  Boolean: Scalars["Boolean"]["output"];
  BoundingBoxInput: BoundingBoxInput;
  ColumnDef: ColumnDef;
  ColumnRoles: ColumnRoles;
  ColumnRolesInput: ColumnRolesInput;
  CreateDataSourceResponse: CreateDataSourceResponse;
  CreateMapResponse: CreateMapResponse;
  DataRecord: DataRecord;
  DataSource: DataSource;
  DataSourceEvent: DataSourceEvent;
  Date: Scalars["Date"]["output"];
  EnrichmentDataSource: EnrichmentDataSource;
  Float: Scalars["Float"]["output"];
  Folder: Folder;
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  JobCompleteEvent: JobCompleteEvent;
  JobFailedEvent: JobFailedEvent;
  JobInfo: JobInfo;
  LooseEnrichment: LooseEnrichment;
  LooseEnrichmentInput: LooseEnrichmentInput;
  LooseGeocodingConfig: LooseGeocodingConfig;
  LooseGeocodingConfigInput: LooseGeocodingConfigInput;
  Map: Map;
  MapConfig: MapConfig;
  MapConfigInput: MapConfigInput;
  MapInput: MapInput;
  MapView: MapView;
  MapViewConfig: MapViewConfig;
  MapViewConfigInput: MapViewConfigInput;
  MapViewInput: MapViewInput;
  Mutation: {};
  MutationResponse: MutationResponse;
  Organisation: Organisation;
  PlacedMarker: PlacedMarker;
  Point: Point;
  PointInput: PointInput;
  Query: {};
  RecordsProcessedEvent: RecordsProcessedEvent;
  SortInput: SortInput;
  String: Scalars["String"]["output"];
  Subscription: {};
  Turf: Turf;
  UpdateMapConfigResponse: UpdateMapConfigResponse;
  UpdateMapResponse: UpdateMapResponse;
  UpsertFolderResponse: UpsertFolderResponse;
  UpsertMapViewResponse: UpsertMapViewResponse;
  UpsertPlacedMarkerResponse: UpsertPlacedMarkerResponse;
  UpsertTurfResponse: UpsertTurfResponse;
};

export type AuthDirectiveArgs = {
  read?: Maybe<ArgNames>;
  write?: Maybe<ArgNames>;
};

export type AuthDirectiveResolver<
  Result,
  Parent,
  ContextType = GraphQLContext,
  Args = AuthDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AreaStatResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["AreaStat"] = ResolversParentTypes["AreaStat"],
> = {
  areaCode?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  value?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AreaStatsResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["AreaStats"] = ResolversParentTypes["AreaStats"],
> = {
  column?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  columnType?: Resolver<ResolversTypes["ColumnType"], ParentType, ContextType>;
  stats?: Resolver<Array<ResolversTypes["AreaStat"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ColumnDefResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ColumnDef"] = ResolversParentTypes["ColumnDef"],
> = {
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  type?: Resolver<ResolversTypes["ColumnType"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ColumnRolesResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ColumnRoles"] = ResolversParentTypes["ColumnRoles"],
> = {
  nameColumn?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateDataSourceResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["CreateDataSourceResponse"] = ResolversParentTypes["CreateDataSourceResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<
    Maybe<ResolversTypes["DataSource"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateMapResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["CreateMapResponse"] = ResolversParentTypes["CreateMapResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["Map"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataRecordResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DataRecord"] = ResolversParentTypes["DataRecord"],
> = {
  externalId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  geocodePoint?: Resolver<
    Maybe<ResolversTypes["Point"]>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  json?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataSourceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DataSource"] = ResolversParentTypes["DataSource"],
> = {
  autoEnrich?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  autoImport?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  columnDefs?: Resolver<
    Array<ResolversTypes["ColumnDef"]>,
    ParentType,
    ContextType
  >;
  columnRoles?: Resolver<
    ResolversTypes["ColumnRoles"],
    ParentType,
    ContextType
  >;
  config?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["Date"], ParentType, ContextType>;
  enrichmentDataSources?: Resolver<
    Maybe<Array<ResolversTypes["EnrichmentDataSource"]>>,
    ParentType,
    ContextType
  >;
  enrichmentInfo?: Resolver<
    Maybe<ResolversTypes["JobInfo"]>,
    ParentType,
    ContextType
  >;
  enrichments?: Resolver<
    Array<ResolversTypes["LooseEnrichment"]>,
    ParentType,
    ContextType
  >;
  geocodingConfig?: Resolver<
    ResolversTypes["LooseGeocodingConfig"],
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  importInfo?: Resolver<
    Maybe<ResolversTypes["JobInfo"]>,
    ParentType,
    ContextType
  >;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  recordCount?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType,
    Partial<DataSourceRecordCountArgs>
  >;
  records?: Resolver<
    Maybe<Array<ResolversTypes["DataRecord"]>>,
    ParentType,
    ContextType,
    Partial<DataSourceRecordsArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataSourceEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DataSourceEvent"] = ResolversParentTypes["DataSourceEvent"],
> = {
  dataSourceId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  enrichmentComplete?: Resolver<
    Maybe<ResolversTypes["JobCompleteEvent"]>,
    ParentType,
    ContextType
  >;
  enrichmentFailed?: Resolver<
    Maybe<ResolversTypes["JobFailedEvent"]>,
    ParentType,
    ContextType
  >;
  importComplete?: Resolver<
    Maybe<ResolversTypes["JobCompleteEvent"]>,
    ParentType,
    ContextType
  >;
  importFailed?: Resolver<
    Maybe<ResolversTypes["JobFailedEvent"]>,
    ParentType,
    ContextType
  >;
  recordsEnriched?: Resolver<
    Maybe<ResolversTypes["RecordsProcessedEvent"]>,
    ParentType,
    ContextType
  >;
  recordsImported?: Resolver<
    Maybe<ResolversTypes["RecordsProcessedEvent"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["Date"], any> {
  name: "Date";
}

export type EnrichmentDataSourceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["EnrichmentDataSource"] = ResolversParentTypes["EnrichmentDataSource"],
> = {
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FolderResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Folder"] = ResolversParentTypes["Folder"],
> = {
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  position?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type JobCompleteEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["JobCompleteEvent"] = ResolversParentTypes["JobCompleteEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobFailedEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["JobFailedEvent"] = ResolversParentTypes["JobFailedEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["JobInfo"] = ResolversParentTypes["JobInfo"],
> = {
  lastCompleted?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<
    Maybe<ResolversTypes["JobStatus"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LooseEnrichmentResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["LooseEnrichment"] = ResolversParentTypes["LooseEnrichment"],
> = {
  areaProperty?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  areaSetCode?: Resolver<
    Maybe<ResolversTypes["AreaSetCode"]>,
    ParentType,
    ContextType
  >;
  dataSourceColumn?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  dataSourceId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  sourceType?: Resolver<
    ResolversTypes["EnrichmentSourceType"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LooseGeocodingConfigResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["LooseGeocodingConfig"] = ResolversParentTypes["LooseGeocodingConfig"],
> = {
  areaSetCode?: Resolver<
    Maybe<ResolversTypes["AreaSetCode"]>,
    ParentType,
    ContextType
  >;
  column?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes["GeocodingType"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Map"] = ResolversParentTypes["Map"],
> = {
  config?: Resolver<ResolversTypes["MapConfig"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["Date"], ParentType, ContextType>;
  folders?: Resolver<
    Maybe<Array<ResolversTypes["Folder"]>>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  placedMarkers?: Resolver<
    Maybe<Array<ResolversTypes["PlacedMarker"]>>,
    ParentType,
    ContextType
  >;
  turfs?: Resolver<
    Maybe<Array<ResolversTypes["Turf"]>>,
    ParentType,
    ContextType
  >;
  views?: Resolver<
    Maybe<Array<ResolversTypes["MapView"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapConfigResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["MapConfig"] = ResolversParentTypes["MapConfig"],
> = {
  markerDataSourceIds?: Resolver<
    Array<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  membersDataSourceId?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapViewResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["MapView"] = ResolversParentTypes["MapView"],
> = {
  config?: Resolver<ResolversTypes["MapViewConfig"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  mapId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  position?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapViewConfigResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["MapViewConfig"] = ResolversParentTypes["MapViewConfig"],
> = {
  areaDataColumn?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  areaDataSourceId?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  areaSetGroupCode?: Resolver<
    Maybe<ResolversTypes["AreaSetGroupCode"]>,
    ParentType,
    ContextType
  >;
  excludeColumnsString?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  mapStyleName?: Resolver<
    ResolversTypes["MapStyleName"],
    ParentType,
    ContextType
  >;
  showBoundaryOutline?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  showLabels?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  showLocations?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  showMembers?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  showTurf?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = {
  createDataSource?: Resolver<
    Maybe<ResolversTypes["CreateDataSourceResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateDataSourceArgs,
      "name" | "organisationId" | "rawConfig"
    >
  >;
  createMap?: Resolver<
    Maybe<ResolversTypes["CreateMapResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateMapArgs, "organisationId">
  >;
  deleteFolder?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteFolderArgs, "id" | "mapId">
  >;
  deleteMap?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteMapArgs, "id">
  >;
  deletePlacedMarker?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeletePlacedMarkerArgs, "id" | "mapId">
  >;
  deleteTurf?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteTurfArgs, "id" | "mapId">
  >;
  enqueueEnrichDataSourceJob?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationEnqueueEnrichDataSourceJobArgs, "dataSourceId">
  >;
  enqueueImportDataSourceJob?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationEnqueueImportDataSourceJobArgs, "dataSourceId">
  >;
  updateDataSourceConfig?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateDataSourceConfigArgs, "id">
  >;
  updateMap?: Resolver<
    Maybe<ResolversTypes["UpdateMapResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateMapArgs, "id" | "map">
  >;
  updateMapConfig?: Resolver<
    Maybe<ResolversTypes["UpdateMapConfigResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateMapConfigArgs, "mapConfig" | "mapId" | "views">
  >;
  upsertFolder?: Resolver<
    Maybe<ResolversTypes["UpsertFolderResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpsertFolderArgs,
      "id" | "mapId" | "name" | "notes" | "position"
    >
  >;
  upsertPlacedMarker?: Resolver<
    Maybe<ResolversTypes["UpsertPlacedMarkerResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpsertPlacedMarkerArgs,
      "id" | "label" | "mapId" | "notes" | "point" | "position"
    >
  >;
  upsertTurf?: Resolver<
    Maybe<ResolversTypes["UpsertTurfResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpsertTurfArgs,
      "area" | "createdAt" | "geometry" | "label" | "mapId" | "notes"
    >
  >;
};

export type MutationResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["MutationResponse"] = ResolversParentTypes["MutationResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganisationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Organisation"] = ResolversParentTypes["Organisation"],
> = {
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlacedMarkerResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PlacedMarker"] = ResolversParentTypes["PlacedMarker"],
> = {
  folderId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  label?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  point?: Resolver<ResolversTypes["Point"], ParentType, ContextType>;
  position?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PointResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Point"] = ResolversParentTypes["Point"],
> = {
  lat?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  lng?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = {
  areaStats?: Resolver<
    Maybe<ResolversTypes["AreaStats"]>,
    ParentType,
    ContextType,
    RequireFields<
      QueryAreaStatsArgs,
      "areaSetCode" | "column" | "dataSourceId" | "excludeColumns" | "operation"
    >
  >;
  dataSource?: Resolver<
    Maybe<ResolversTypes["DataSource"]>,
    ParentType,
    ContextType,
    RequireFields<QueryDataSourceArgs, "id">
  >;
  dataSources?: Resolver<
    Maybe<Array<ResolversTypes["DataSource"]>>,
    ParentType,
    ContextType,
    Partial<QueryDataSourcesArgs>
  >;
  map?: Resolver<
    Maybe<ResolversTypes["Map"]>,
    ParentType,
    ContextType,
    RequireFields<QueryMapArgs, "id">
  >;
  maps?: Resolver<
    Maybe<Array<ResolversTypes["Map"]>>,
    ParentType,
    ContextType,
    RequireFields<QueryMapsArgs, "organisationId">
  >;
  organisations?: Resolver<
    Maybe<Array<ResolversTypes["Organisation"]>>,
    ParentType,
    ContextType
  >;
};

export type RecordsProcessedEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["RecordsProcessedEvent"] = ResolversParentTypes["RecordsProcessedEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  count?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Subscription"] = ResolversParentTypes["Subscription"],
> = {
  dataSourceEvent?: SubscriptionResolver<
    Maybe<ResolversTypes["DataSourceEvent"]>,
    "dataSourceEvent",
    ParentType,
    ContextType,
    RequireFields<SubscriptionDataSourceEventArgs, "dataSourceId">
  >;
};

export type TurfResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Turf"] = ResolversParentTypes["Turf"],
> = {
  area?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["Date"], ParentType, ContextType>;
  geometry?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  label?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateMapConfigResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpdateMapConfigResponse"] = ResolversParentTypes["UpdateMapConfigResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateMapResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpdateMapResponse"] = ResolversParentTypes["UpdateMapResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["Map"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpsertFolderResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpsertFolderResponse"] = ResolversParentTypes["UpsertFolderResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["Folder"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpsertMapViewResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpsertMapViewResponse"] = ResolversParentTypes["UpsertMapViewResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpsertPlacedMarkerResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpsertPlacedMarkerResponse"] = ResolversParentTypes["UpsertPlacedMarkerResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<
    Maybe<ResolversTypes["PlacedMarker"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpsertTurfResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpsertTurfResponse"] = ResolversParentTypes["UpsertTurfResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["Turf"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AreaStat?: AreaStatResolvers<ContextType>;
  AreaStats?: AreaStatsResolvers<ContextType>;
  ColumnDef?: ColumnDefResolvers<ContextType>;
  ColumnRoles?: ColumnRolesResolvers<ContextType>;
  CreateDataSourceResponse?: CreateDataSourceResponseResolvers<ContextType>;
  CreateMapResponse?: CreateMapResponseResolvers<ContextType>;
  DataRecord?: DataRecordResolvers<ContextType>;
  DataSource?: DataSourceResolvers<ContextType>;
  DataSourceEvent?: DataSourceEventResolvers<ContextType>;
  Date?: GraphQLScalarType;
  EnrichmentDataSource?: EnrichmentDataSourceResolvers<ContextType>;
  Folder?: FolderResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobCompleteEvent?: JobCompleteEventResolvers<ContextType>;
  JobFailedEvent?: JobFailedEventResolvers<ContextType>;
  JobInfo?: JobInfoResolvers<ContextType>;
  LooseEnrichment?: LooseEnrichmentResolvers<ContextType>;
  LooseGeocodingConfig?: LooseGeocodingConfigResolvers<ContextType>;
  Map?: MapResolvers<ContextType>;
  MapConfig?: MapConfigResolvers<ContextType>;
  MapView?: MapViewResolvers<ContextType>;
  MapViewConfig?: MapViewConfigResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponse?: MutationResponseResolvers<ContextType>;
  Organisation?: OrganisationResolvers<ContextType>;
  PlacedMarker?: PlacedMarkerResolvers<ContextType>;
  Point?: PointResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RecordsProcessedEvent?: RecordsProcessedEventResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Turf?: TurfResolvers<ContextType>;
  UpdateMapConfigResponse?: UpdateMapConfigResponseResolvers<ContextType>;
  UpdateMapResponse?: UpdateMapResponseResolvers<ContextType>;
  UpsertFolderResponse?: UpsertFolderResponseResolvers<ContextType>;
  UpsertMapViewResponse?: UpsertMapViewResponseResolvers<ContextType>;
  UpsertPlacedMarkerResponse?: UpsertPlacedMarkerResponseResolvers<ContextType>;
  UpsertTurfResponse?: UpsertTurfResponseResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
};
