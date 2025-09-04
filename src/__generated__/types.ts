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

export type BoundingBoxInput = {
  east: Scalars["Float"]["input"];
  north: Scalars["Float"]["input"];
  south: Scalars["Float"]["input"];
  west: Scalars["Float"]["input"];
};

export enum CalculationType {
  Average = "Average",
  Count = "Count",
  Sum = "Sum",
  Value = "Value",
}

export enum ColorScheme {
  Diverging = "Diverging",
  GreenYellowRed = "GreenYellowRed",
  Plasma = "Plasma",
  RedBlue = "RedBlue",
  Sequential = "Sequential",
  Viridis = "Viridis",
}

export type ColumnDef = {
  __typename?: "ColumnDef";
  name: Scalars["String"]["output"];
  type: ColumnType;
};

export type ColumnRoles = {
  __typename?: "ColumnRoles";
  nameColumns?: Maybe<Array<Scalars["String"]["output"]>>;
};

export type ColumnRolesInput = {
  nameColumns: Array<Scalars["String"]["input"]>;
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
  public: Scalars["Boolean"]["output"];
  recordCount?: Maybe<RecordCount>;
  recordType: DataSourceRecordType;
  records?: Maybe<Array<DataRecord>>;
};

export type DataSourceRecordCountArgs = {
  filter?: InputMaybe<RecordFilterInput>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DataSourceRecordsArgs = {
  all?: InputMaybe<Scalars["Boolean"]["input"]>;
  filter?: InputMaybe<RecordFilterInput>;
  page?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sort?: InputMaybe<Array<SortInput>>;
};

export type DataSourceEvent = {
  __typename?: "DataSourceEvent";
  dataSourceId: Scalars["String"]["output"];
  enrichmentComplete?: Maybe<JobStatusEvent>;
  enrichmentFailed?: Maybe<JobStatusEvent>;
  enrichmentStarted?: Maybe<JobStatusEvent>;
  importComplete?: Maybe<JobStatusEvent>;
  importFailed?: Maybe<JobStatusEvent>;
  importStarted?: Maybe<JobStatusEvent>;
  recordsEnriched?: Maybe<RecordsProcessedEvent>;
  recordsImported?: Maybe<RecordsProcessedEvent>;
};

export enum DataSourceRecordType {
  Data = "Data",
  Events = "Events",
  Locations = "Locations",
  Members = "Members",
  Other = "Other",
  People = "People",
}

export type DataSourceView = {
  __typename?: "DataSourceView";
  dataSourceId: Scalars["String"]["output"];
  filter: RecordFilter;
  search: Scalars["String"]["output"];
  sort: Array<Sort>;
};

export type DataSourceViewInput = {
  dataSourceId: Scalars["String"]["input"];
  filter: RecordFilterInput;
  search: Scalars["String"]["input"];
  sort: Array<SortInput>;
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

export enum FilterOperator {
  AND = "AND",
  OR = "OR",
}

export enum FilterType {
  GEO = "GEO",
  MULTI = "MULTI",
  TEXT = "TEXT",
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

export type JobStatusEvent = {
  __typename?: "JobStatusEvent";
  at: Scalars["String"]["output"];
};

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
  columns?: Maybe<Array<Scalars["String"]["output"]>>;
  type: GeocodingType;
};

export type LooseGeocodingConfigInput = {
  areaSetCode?: InputMaybe<AreaSetCode>;
  column?: InputMaybe<Scalars["String"]["input"]>;
  columns?: InputMaybe<Array<Scalars["String"]["input"]>>;
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
  dataSourceViews: Array<DataSourceView>;
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
  calculationType?: Maybe<CalculationType>;
  colorScheme?: Maybe<ColorScheme>;
  excludeColumnsString: Scalars["String"]["output"];
  mapStyleName: MapStyleName;
  showBoundaryOutline: Scalars["Boolean"]["output"];
  showLabels: Scalars["Boolean"]["output"];
  showLocations: Scalars["Boolean"]["output"];
  showMembers: Scalars["Boolean"]["output"];
  showTurf: Scalars["Boolean"]["output"];
  visualisationType?: Maybe<VisualisationType>;
};

export type MapViewConfigInput = {
  areaDataColumn?: InputMaybe<Scalars["String"]["input"]>;
  areaDataSourceId?: InputMaybe<Scalars["String"]["input"]>;
  areaSetGroupCode?: InputMaybe<AreaSetGroupCode>;
  calculationType?: InputMaybe<CalculationType>;
  colorScheme?: InputMaybe<ColorScheme>;
  excludeColumnsString?: InputMaybe<Scalars["String"]["input"]>;
  mapStyleName?: InputMaybe<MapStyleName>;
  showBoundaryOutline?: InputMaybe<Scalars["Boolean"]["input"]>;
  showLabels?: InputMaybe<Scalars["Boolean"]["input"]>;
  showLocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  showMembers?: InputMaybe<Scalars["Boolean"]["input"]>;
  showTurf?: InputMaybe<Scalars["Boolean"]["input"]>;
  visualisationType?: InputMaybe<VisualisationType>;
};

export type MapViewInput = {
  config: MapViewConfigInput;
  dataSourceViews: Array<DataSourceViewInput>;
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
  forgotPassword?: Maybe<MutationResponse>;
  resetPassword?: Maybe<MutationResponse>;
  saveMapViewsToCRM?: Maybe<MutationResponse>;
  updateDataSourceConfig?: Maybe<MutationResponse>;
  updateMap?: Maybe<UpdateMapResponse>;
  updateMapConfig?: Maybe<UpdateMapConfigResponse>;
  updateUser?: Maybe<UpdateUserResponse>;
  upsertFolder?: Maybe<UpsertFolderResponse>;
  upsertPlacedMarker?: Maybe<UpsertPlacedMarkerResponse>;
  upsertPublicMap?: Maybe<UpsertPublicMapResponse>;
  upsertTurf?: Maybe<UpsertTurfResponse>;
};

export type MutationCreateDataSourceArgs = {
  name: Scalars["String"]["input"];
  organisationId: Scalars["String"]["input"];
  rawConfig: Scalars["JSON"]["input"];
  recordType: DataSourceRecordType;
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

export type MutationForgotPasswordArgs = {
  email: Scalars["String"]["input"];
};

export type MutationResetPasswordArgs = {
  password: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
};

export type MutationSaveMapViewsToCrmArgs = {
  id: Scalars["String"]["input"];
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

export type MutationUpdateUserArgs = {
  data: UpdateUserInput;
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

export type MutationUpsertPublicMapArgs = {
  dataSourceConfigs: Array<PublicMapDataSourceConfigInput>;
  description: Scalars["String"]["input"];
  descriptionLink: Scalars["String"]["input"];
  host: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  published: Scalars["Boolean"]["input"];
  viewId: Scalars["String"]["input"];
};

export type MutationUpsertTurfArgs = {
  area: Scalars["Float"]["input"];
  createdAt: Scalars["Date"]["input"];
  id?: InputMaybe<Scalars["String"]["input"]>;
  label: Scalars["String"]["input"];
  mapId: Scalars["String"]["input"];
  notes: Scalars["String"]["input"];
  polygon: Scalars["JSON"]["input"];
};

export type MutationResponse = {
  __typename?: "MutationResponse";
  code: Scalars["Int"]["output"];
};

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

export type PolygonInput = {
  coordinates: Array<Array<Array<Scalars["Float"]["input"]>>>;
  type: Scalars["String"]["input"];
};

export type ProtectedArgs = {
  dataSourceIdArg?: InputMaybe<Scalars["String"]["input"]>;
  mapIdArg?: InputMaybe<Scalars["String"]["input"]>;
  organisationIdArg?: InputMaybe<Scalars["String"]["input"]>;
  viewIdArg?: InputMaybe<Scalars["String"]["input"]>;
};

export type PublicMap = {
  __typename?: "PublicMap";
  dataSourceConfigs: Array<PublicMapDataSourceConfig>;
  description: Scalars["String"]["output"];
  descriptionLink: Scalars["String"]["output"];
  host: Scalars["String"]["output"];
  id: Scalars["String"]["output"];
  mapId: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  published: Scalars["Boolean"]["output"];
  viewId: Scalars["String"]["output"];
};

export type PublicMapColumn = {
  __typename?: "PublicMapColumn";
  label: Scalars["String"]["output"];
  sourceColumns: Array<Scalars["String"]["output"]>;
  type: PublicMapColumnType;
};

export type PublicMapColumnInput = {
  label: Scalars["String"]["input"];
  sourceColumns: Array<Scalars["String"]["input"]>;
  type: PublicMapColumnType;
};

export enum PublicMapColumnType {
  Boolean = "Boolean",
  CommaSeparatedList = "CommaSeparatedList",
  String = "String",
}

export type PublicMapDataSourceConfig = {
  __typename?: "PublicMapDataSourceConfig";
  additionalColumns: Array<PublicMapColumn>;
  dataSourceId: Scalars["String"]["output"];
  dataSourceLabel: Scalars["String"]["output"];
  descriptionColumn: Scalars["String"]["output"];
  descriptionLabel: Scalars["String"]["output"];
  nameColumns: Array<Scalars["String"]["output"]>;
  nameLabel: Scalars["String"]["output"];
};

export type PublicMapDataSourceConfigInput = {
  additionalColumns: Array<PublicMapColumnInput>;
  dataSourceId: Scalars["String"]["input"];
  dataSourceLabel: Scalars["String"]["input"];
  descriptionColumn: Scalars["String"]["input"];
  descriptionLabel: Scalars["String"]["input"];
  nameColumns: Array<Scalars["String"]["input"]>;
  nameLabel: Scalars["String"]["input"];
};

export type Query = {
  __typename?: "Query";
  areaStats?: Maybe<AreaStats>;
  dataSource?: Maybe<DataSource>;
  dataSources?: Maybe<Array<DataSource>>;
  map?: Maybe<Map>;
  maps?: Maybe<Array<Map>>;
  organisations?: Maybe<Array<Organisation>>;
  publicMap?: Maybe<PublicMap>;
  publishedPublicMap?: Maybe<PublicMap>;
};

export type QueryAreaStatsArgs = {
  areaSetCode: AreaSetCode;
  boundingBox?: InputMaybe<BoundingBoxInput>;
  calculationType: CalculationType;
  column: Scalars["String"]["input"];
  dataSourceId: Scalars["String"]["input"];
  excludeColumns: Array<Scalars["String"]["input"]>;
};

export type QueryDataSourceArgs = {
  id: Scalars["String"]["input"];
};

export type QueryDataSourcesArgs = {
  includePublic?: InputMaybe<Scalars["Boolean"]["input"]>;
  organisationId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryMapArgs = {
  id: Scalars["String"]["input"];
};

export type QueryMapsArgs = {
  organisationId: Scalars["String"]["input"];
};

export type QueryPublicMapArgs = {
  viewId: Scalars["String"]["input"];
};

export type QueryPublishedPublicMapArgs = {
  host: Scalars["String"]["input"];
};

export type RecordCount = {
  __typename?: "RecordCount";
  count: Scalars["Int"]["output"];
  matched: Scalars["Int"]["output"];
};

export type RecordFilter = {
  __typename?: "RecordFilter";
  children?: Maybe<Array<RecordFilter>>;
  column?: Maybe<Scalars["String"]["output"]>;
  dataRecordId?: Maybe<Scalars["String"]["output"]>;
  dataSourceId?: Maybe<Scalars["String"]["output"]>;
  distance?: Maybe<Scalars["Int"]["output"]>;
  label?: Maybe<Scalars["String"]["output"]>;
  operator?: Maybe<FilterOperator>;
  placedMarker?: Maybe<Scalars["String"]["output"]>;
  search?: Maybe<Scalars["String"]["output"]>;
  turf?: Maybe<Scalars["String"]["output"]>;
  type: FilterType;
};

export type RecordFilterInput = {
  children?: InputMaybe<Array<RecordFilterInput>>;
  column?: InputMaybe<Scalars["String"]["input"]>;
  dataRecordId?: InputMaybe<Scalars["String"]["input"]>;
  dataSourceId?: InputMaybe<Scalars["String"]["input"]>;
  distance?: InputMaybe<Scalars["Int"]["input"]>;
  label?: InputMaybe<Scalars["String"]["input"]>;
  operator?: InputMaybe<FilterOperator>;
  placedMarker?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  turf?: InputMaybe<Scalars["String"]["input"]>;
  type: FilterType;
};

export type RecordsProcessedEvent = {
  __typename?: "RecordsProcessedEvent";
  at: Scalars["String"]["output"];
  count: Scalars["Int"]["output"];
};

export type Sort = {
  __typename?: "Sort";
  desc: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
};

export type SortInput = {
  desc: Scalars["Boolean"]["input"];
  location?: InputMaybe<PointInput>;
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
  id: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
  notes: Scalars["String"]["output"];
  polygon: Scalars["JSON"]["output"];
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

export type UpdateUserInput = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserResponse = {
  __typename?: "UpdateUserResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<User>;
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

export type UpsertPublicMapResponse = {
  __typename?: "UpsertPublicMapResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<PublicMap>;
};

export type UpsertTurfResponse = {
  __typename?: "UpsertTurfResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<Turf>;
};

export type User = {
  __typename?: "User";
  createdAt: Scalars["Date"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["String"]["output"];
};

export enum VisualisationType {
  BoundaryOnly = "BoundaryOnly",
  Choropleth = "Choropleth",
}

export type UpdateUserPasswordMutationVariables = Exact<{
  data: UpdateUserInput;
}>;

export type UpdateUserPasswordMutation = {
  __typename?: "Mutation";
  updateUser?: {
    __typename?: "UpdateUserResponse";
    code: number;
    result?: { __typename?: "User"; id: string } | null;
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
    importStarted?: { __typename?: "JobStatusEvent"; at: string } | null;
    importComplete?: { __typename?: "JobStatusEvent"; at: string } | null;
    importFailed?: { __typename?: "JobStatusEvent"; at: string } | null;
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
    enrichmentComplete?: { __typename?: "JobStatusEvent"; at: string } | null;
    enrichmentFailed?: { __typename?: "JobStatusEvent"; at: string } | null;
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
    recordType: DataSourceRecordType;
    autoEnrich: boolean;
    autoImport: boolean;
    config: any;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnRoles: {
      __typename?: "ColumnRoles";
      nameColumns?: Array<string> | null;
    };
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
      columns?: Array<string> | null;
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
    recordCount?: { __typename?: "RecordCount"; count: number } | null;
  } | null;
};

export type CreateDataSourceMutationVariables = Exact<{
  name: Scalars["String"]["input"];
  organisationId: Scalars["String"]["input"];
  recordType: DataSourceRecordType;
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
    public: boolean;
    autoEnrich: boolean;
    autoImport: boolean;
    recordType: DataSourceRecordType;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnRoles: {
      __typename?: "ColumnRoles";
      nameColumns?: Array<string> | null;
    };
    recordCount?: { __typename?: "RecordCount"; count: number } | null;
    geocodingConfig: {
      __typename?: "LooseGeocodingConfig";
      type: GeocodingType;
      column?: string | null;
      columns?: Array<string> | null;
      areaSetCode?: AreaSetCode | null;
    };
    enrichments: Array<{
      __typename?: "LooseEnrichment";
      sourceType: EnrichmentSourceType;
      areaSetCode?: AreaSetCode | null;
      areaProperty?: string | null;
      dataSourceId?: string | null;
      dataSourceColumn?: string | null;
    }>;
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

export type SaveMapViewsToCrmMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type SaveMapViewsToCrmMutation = {
  __typename?: "Mutation";
  saveMapViewsToCRM?: { __typename?: "MutationResponse"; code: number } | null;
};

export type DeleteMapMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DeleteMapMutation = {
  __typename?: "Mutation";
  deleteMap?: { __typename?: "MutationResponse"; code: number } | null;
};

export type PublicMapQueryVariables = Exact<{
  viewId: Scalars["String"]["input"];
}>;

export type PublicMapQuery = {
  __typename?: "Query";
  publicMap?: {
    __typename?: "PublicMap";
    id: string;
    mapId: string;
    viewId: string;
    host: string;
    name: string;
    description: string;
    descriptionLink: string;
    published: boolean;
    dataSourceConfigs: Array<{
      __typename?: "PublicMapDataSourceConfig";
      dataSourceId: string;
      dataSourceLabel: string;
      nameLabel: string;
      nameColumns: Array<string>;
      descriptionLabel: string;
      descriptionColumn: string;
      additionalColumns: Array<{
        __typename?: "PublicMapColumn";
        label: string;
        sourceColumns: Array<string>;
        type: PublicMapColumnType;
      }>;
    }>;
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

export type PublicMapModalQueryVariables = Exact<{
  viewId: Scalars["String"]["input"];
}>;

export type PublicMapModalQuery = {
  __typename?: "Query";
  publicMap?: {
    __typename?: "PublicMap";
    id: string;
    host: string;
    name: string;
    description: string;
    descriptionLink: string;
    published: boolean;
    dataSourceConfigs: Array<{
      __typename?: "PublicMapDataSourceConfig";
      dataSourceId: string;
      dataSourceLabel: string;
      nameLabel: string;
      nameColumns: Array<string>;
      descriptionLabel: string;
      descriptionColumn: string;
      additionalColumns: Array<{
        __typename?: "PublicMapColumn";
        label: string;
        sourceColumns: Array<string>;
        type: PublicMapColumnType;
      }>;
    }>;
  } | null;
};

export type UpsertPublicMapMutationVariables = Exact<{
  viewId: Scalars["String"]["input"];
  host: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  description: Scalars["String"]["input"];
  descriptionLink: Scalars["String"]["input"];
  published: Scalars["Boolean"]["input"];
  dataSourceConfigs:
    | Array<PublicMapDataSourceConfigInput>
    | PublicMapDataSourceConfigInput;
}>;

export type UpsertPublicMapMutation = {
  __typename?: "Mutation";
  upsertPublicMap?: {
    __typename?: "UpsertPublicMapResponse";
    code: number;
    result?: {
      __typename?: "PublicMap";
      host: string;
      published: boolean;
    } | null;
  } | null;
};

export type FilterDataRecordsQueryVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
  search?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type FilterDataRecordsQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    columnRoles: {
      __typename?: "ColumnRoles";
      nameColumns?: Array<string> | null;
    };
    records?: Array<{
      __typename?: "DataRecord";
      id: string;
      externalId: string;
      json: any;
    }> | null;
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
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnRoles: {
      __typename?: "ColumnRoles";
      nameColumns?: Array<string> | null;
    };
    geocodingConfig: {
      __typename?: "LooseGeocodingConfig";
      areaSetCode?: AreaSetCode | null;
      type: GeocodingType;
      column?: string | null;
    };
    recordCount?: { __typename?: "RecordCount"; count: number } | null;
  }> | null;
};

export type DataRecordsQueryVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
  filter?: InputMaybe<RecordFilterInput>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  page: Scalars["Int"]["input"];
  sort?: InputMaybe<Array<SortInput> | SortInput>;
}>;

export type DataRecordsQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
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
    recordCount?: {
      __typename?: "RecordCount";
      count: number;
      matched: number;
    } | null;
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
      polygon: any;
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
        visualisationType?: VisualisationType | null;
        calculationType?: CalculationType | null;
        colorScheme?: ColorScheme | null;
      };
      dataSourceViews: Array<{
        __typename?: "DataSourceView";
        dataSourceId: string;
        search: string;
        filter: {
          __typename?: "RecordFilter";
          type: FilterType;
          children?: Array<{
            __typename?: "RecordFilter";
            column?: string | null;
            dataSourceId?: string | null;
            dataRecordId?: string | null;
            distance?: number | null;
            label?: string | null;
            operator?: FilterOperator | null;
            placedMarker?: string | null;
            search?: string | null;
            turf?: string | null;
            type: FilterType;
          }> | null;
        };
        sort: Array<{ __typename?: "Sort"; name: string; desc: boolean }>;
      }>;
    }> | null;
  } | null;
};

export type AreaStatsQueryVariables = Exact<{
  areaSetCode: AreaSetCode;
  dataSourceId: Scalars["String"]["input"];
  column: Scalars["String"]["input"];
  excludeColumns:
    | Array<Scalars["String"]["input"]>
    | Scalars["String"]["input"];
  boundingBox?: InputMaybe<BoundingBoxInput>;
  calculationType: CalculationType;
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
  polygon: Scalars["JSON"]["input"];
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

export type PublicMapDataRecordsQueryVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
  filter?: InputMaybe<RecordFilterInput>;
  sort?: InputMaybe<Array<SortInput> | SortInput>;
}>;

export type PublicMapDataRecordsQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    id: string;
    name: string;
    columnRoles: {
      __typename?: "ColumnRoles";
      nameColumns?: Array<string> | null;
    };
    records?: Array<{
      __typename?: "DataRecord";
      id: string;
      externalId: string;
      json: any;
      geocodePoint?: { __typename?: "Point"; lat: number; lng: number } | null;
    }> | null;
    recordCount?: {
      __typename?: "RecordCount";
      count: number;
      matched: number;
    } | null;
  } | null;
};

export type PublishedPublicMapQueryVariables = Exact<{
  host: Scalars["String"]["input"];
}>;

export type PublishedPublicMapQuery = {
  __typename?: "Query";
  publishedPublicMap?: {
    __typename?: "PublicMap";
    id: string;
    mapId: string;
    viewId: string;
    host: string;
    name: string;
    description: string;
    descriptionLink: string;
    published: boolean;
    dataSourceConfigs: Array<{
      __typename?: "PublicMapDataSourceConfig";
      dataSourceId: string;
      dataSourceLabel: string;
      nameLabel: string;
      nameColumns: Array<string>;
      descriptionLabel: string;
      descriptionColumn: string;
      additionalColumns: Array<{
        __typename?: "PublicMapColumn";
        label: string;
        sourceColumns: Array<string>;
        type: PublicMapColumnType;
      }>;
    }>;
  } | null;
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
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  BoundingBoxInput: BoundingBoxInput;
  CalculationType: CalculationType;
  ColorScheme: ColorScheme;
  ColumnDef: ResolverTypeWrapper<ColumnDef>;
  ColumnRoles: ResolverTypeWrapper<ColumnRoles>;
  ColumnRolesInput: ColumnRolesInput;
  ColumnType: ColumnType;
  CreateDataSourceResponse: ResolverTypeWrapper<CreateDataSourceResponse>;
  CreateMapResponse: ResolverTypeWrapper<CreateMapResponse>;
  DataRecord: ResolverTypeWrapper<DataRecord>;
  DataSource: ResolverTypeWrapper<DataSource>;
  DataSourceEvent: ResolverTypeWrapper<DataSourceEvent>;
  DataSourceRecordType: DataSourceRecordType;
  DataSourceView: ResolverTypeWrapper<DataSourceView>;
  DataSourceViewInput: DataSourceViewInput;
  Date: ResolverTypeWrapper<Scalars["Date"]["output"]>;
  EnrichmentDataSource: ResolverTypeWrapper<EnrichmentDataSource>;
  EnrichmentSourceType: EnrichmentSourceType;
  FilterOperator: FilterOperator;
  FilterType: FilterType;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  Folder: ResolverTypeWrapper<Folder>;
  GeocodingType: GeocodingType;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  JobInfo: ResolverTypeWrapper<JobInfo>;
  JobStatus: JobStatus;
  JobStatusEvent: ResolverTypeWrapper<JobStatusEvent>;
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
  Organisation: ResolverTypeWrapper<Organisation>;
  PlacedMarker: ResolverTypeWrapper<PlacedMarker>;
  Point: ResolverTypeWrapper<Point>;
  PointInput: PointInput;
  PolygonInput: PolygonInput;
  ProtectedArgs: ProtectedArgs;
  PublicMap: ResolverTypeWrapper<PublicMap>;
  PublicMapColumn: ResolverTypeWrapper<PublicMapColumn>;
  PublicMapColumnInput: PublicMapColumnInput;
  PublicMapColumnType: PublicMapColumnType;
  PublicMapDataSourceConfig: ResolverTypeWrapper<PublicMapDataSourceConfig>;
  PublicMapDataSourceConfigInput: PublicMapDataSourceConfigInput;
  Query: ResolverTypeWrapper<{}>;
  RecordCount: ResolverTypeWrapper<RecordCount>;
  RecordFilter: ResolverTypeWrapper<RecordFilter>;
  RecordFilterInput: RecordFilterInput;
  RecordsProcessedEvent: ResolverTypeWrapper<RecordsProcessedEvent>;
  Sort: ResolverTypeWrapper<Sort>;
  SortInput: SortInput;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  Subscription: ResolverTypeWrapper<{}>;
  Turf: ResolverTypeWrapper<Turf>;
  UpdateMapConfigResponse: ResolverTypeWrapper<UpdateMapConfigResponse>;
  UpdateMapResponse: ResolverTypeWrapper<UpdateMapResponse>;
  UpdateUserInput: UpdateUserInput;
  UpdateUserResponse: ResolverTypeWrapper<UpdateUserResponse>;
  UpsertFolderResponse: ResolverTypeWrapper<UpsertFolderResponse>;
  UpsertMapViewResponse: ResolverTypeWrapper<UpsertMapViewResponse>;
  UpsertPlacedMarkerResponse: ResolverTypeWrapper<UpsertPlacedMarkerResponse>;
  UpsertPublicMapResponse: ResolverTypeWrapper<UpsertPublicMapResponse>;
  UpsertTurfResponse: ResolverTypeWrapper<UpsertTurfResponse>;
  User: ResolverTypeWrapper<User>;
  VisualisationType: VisualisationType;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AreaStat: AreaStat;
  AreaStats: AreaStats;
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
  DataSourceView: DataSourceView;
  DataSourceViewInput: DataSourceViewInput;
  Date: Scalars["Date"]["output"];
  EnrichmentDataSource: EnrichmentDataSource;
  Float: Scalars["Float"]["output"];
  Folder: Folder;
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  JobInfo: JobInfo;
  JobStatusEvent: JobStatusEvent;
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
  PolygonInput: PolygonInput;
  ProtectedArgs: ProtectedArgs;
  PublicMap: PublicMap;
  PublicMapColumn: PublicMapColumn;
  PublicMapColumnInput: PublicMapColumnInput;
  PublicMapDataSourceConfig: PublicMapDataSourceConfig;
  PublicMapDataSourceConfigInput: PublicMapDataSourceConfigInput;
  Query: {};
  RecordCount: RecordCount;
  RecordFilter: RecordFilter;
  RecordFilterInput: RecordFilterInput;
  RecordsProcessedEvent: RecordsProcessedEvent;
  Sort: Sort;
  SortInput: SortInput;
  String: Scalars["String"]["output"];
  Subscription: {};
  Turf: Turf;
  UpdateMapConfigResponse: UpdateMapConfigResponse;
  UpdateMapResponse: UpdateMapResponse;
  UpdateUserInput: UpdateUserInput;
  UpdateUserResponse: UpdateUserResponse;
  UpsertFolderResponse: UpsertFolderResponse;
  UpsertMapViewResponse: UpsertMapViewResponse;
  UpsertPlacedMarkerResponse: UpsertPlacedMarkerResponse;
  UpsertPublicMapResponse: UpsertPublicMapResponse;
  UpsertTurfResponse: UpsertTurfResponse;
  User: User;
};

export type AuthDirectiveArgs = {
  read?: Maybe<ProtectedArgs>;
  write?: Maybe<ProtectedArgs>;
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
  nameColumns?: Resolver<
    Maybe<Array<ResolversTypes["String"]>>,
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
  public?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  recordCount?: Resolver<
    Maybe<ResolversTypes["RecordCount"]>,
    ParentType,
    ContextType,
    Partial<DataSourceRecordCountArgs>
  >;
  recordType?: Resolver<
    ResolversTypes["DataSourceRecordType"],
    ParentType,
    ContextType
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
    Maybe<ResolversTypes["JobStatusEvent"]>,
    ParentType,
    ContextType
  >;
  enrichmentFailed?: Resolver<
    Maybe<ResolversTypes["JobStatusEvent"]>,
    ParentType,
    ContextType
  >;
  enrichmentStarted?: Resolver<
    Maybe<ResolversTypes["JobStatusEvent"]>,
    ParentType,
    ContextType
  >;
  importComplete?: Resolver<
    Maybe<ResolversTypes["JobStatusEvent"]>,
    ParentType,
    ContextType
  >;
  importFailed?: Resolver<
    Maybe<ResolversTypes["JobStatusEvent"]>,
    ParentType,
    ContextType
  >;
  importStarted?: Resolver<
    Maybe<ResolversTypes["JobStatusEvent"]>,
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

export type DataSourceViewResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DataSourceView"] = ResolversParentTypes["DataSourceView"],
> = {
  dataSourceId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  filter?: Resolver<ResolversTypes["RecordFilter"], ParentType, ContextType>;
  search?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  sort?: Resolver<Array<ResolversTypes["Sort"]>, ParentType, ContextType>;
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

export type JobStatusEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["JobStatusEvent"] = ResolversParentTypes["JobStatusEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
  columns?: Resolver<
    Maybe<Array<ResolversTypes["String"]>>,
    ParentType,
    ContextType
  >;
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
  dataSourceViews?: Resolver<
    Array<ResolversTypes["DataSourceView"]>,
    ParentType,
    ContextType
  >;
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
  calculationType?: Resolver<
    Maybe<ResolversTypes["CalculationType"]>,
    ParentType,
    ContextType
  >;
  colorScheme?: Resolver<
    Maybe<ResolversTypes["ColorScheme"]>,
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
  visualisationType?: Resolver<
    Maybe<ResolversTypes["VisualisationType"]>,
    ParentType,
    ContextType
  >;
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
      "name" | "organisationId" | "rawConfig" | "recordType"
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
  forgotPassword?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationForgotPasswordArgs, "email">
  >;
  resetPassword?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationResetPasswordArgs, "password" | "token">
  >;
  saveMapViewsToCRM?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSaveMapViewsToCrmArgs, "id">
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
  updateUser?: Resolver<
    Maybe<ResolversTypes["UpdateUserResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateUserArgs, "data">
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
  upsertPublicMap?: Resolver<
    Maybe<ResolversTypes["UpsertPublicMapResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpsertPublicMapArgs,
      | "dataSourceConfigs"
      | "description"
      | "descriptionLink"
      | "host"
      | "name"
      | "published"
      | "viewId"
    >
  >;
  upsertTurf?: Resolver<
    Maybe<ResolversTypes["UpsertTurfResponse"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpsertTurfArgs,
      "area" | "createdAt" | "label" | "mapId" | "notes" | "polygon"
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

export type PublicMapResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PublicMap"] = ResolversParentTypes["PublicMap"],
> = {
  dataSourceConfigs?: Resolver<
    Array<ResolversTypes["PublicMapDataSourceConfig"]>,
    ParentType,
    ContextType
  >;
  description?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  descriptionLink?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  host?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  mapId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  published?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  viewId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PublicMapColumnResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PublicMapColumn"] = ResolversParentTypes["PublicMapColumn"],
> = {
  label?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  sourceColumns?: Resolver<
    Array<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  type?: Resolver<
    ResolversTypes["PublicMapColumnType"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PublicMapDataSourceConfigResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PublicMapDataSourceConfig"] = ResolversParentTypes["PublicMapDataSourceConfig"],
> = {
  additionalColumns?: Resolver<
    Array<ResolversTypes["PublicMapColumn"]>,
    ParentType,
    ContextType
  >;
  dataSourceId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  dataSourceLabel?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  descriptionColumn?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  descriptionLabel?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType
  >;
  nameColumns?: Resolver<
    Array<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  nameLabel?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
      | "areaSetCode"
      | "calculationType"
      | "column"
      | "dataSourceId"
      | "excludeColumns"
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
  publicMap?: Resolver<
    Maybe<ResolversTypes["PublicMap"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPublicMapArgs, "viewId">
  >;
  publishedPublicMap?: Resolver<
    Maybe<ResolversTypes["PublicMap"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPublishedPublicMapArgs, "host">
  >;
};

export type RecordCountResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["RecordCount"] = ResolversParentTypes["RecordCount"],
> = {
  count?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  matched?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RecordFilterResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["RecordFilter"] = ResolversParentTypes["RecordFilter"],
> = {
  children?: Resolver<
    Maybe<Array<ResolversTypes["RecordFilter"]>>,
    ParentType,
    ContextType
  >;
  column?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  dataRecordId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  dataSourceId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  distance?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  operator?: Resolver<
    Maybe<ResolversTypes["FilterOperator"]>,
    ParentType,
    ContextType
  >;
  placedMarker?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  search?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  turf?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes["FilterType"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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

export type SortResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Sort"] = ResolversParentTypes["Sort"],
> = {
  desc?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  label?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  notes?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  polygon?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
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

export type UpdateUserResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpdateUserResponse"] = ResolversParentTypes["UpdateUserResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>;
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

export type UpsertPublicMapResponseResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["UpsertPublicMapResponse"] = ResolversParentTypes["UpsertPublicMapResponse"],
> = {
  code?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  result?: Resolver<
    Maybe<ResolversTypes["PublicMap"]>,
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

export type UserResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["User"] = ResolversParentTypes["User"],
> = {
  createdAt?: Resolver<ResolversTypes["Date"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
  DataSourceView?: DataSourceViewResolvers<ContextType>;
  Date?: GraphQLScalarType;
  EnrichmentDataSource?: EnrichmentDataSourceResolvers<ContextType>;
  Folder?: FolderResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobInfo?: JobInfoResolvers<ContextType>;
  JobStatusEvent?: JobStatusEventResolvers<ContextType>;
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
  PublicMap?: PublicMapResolvers<ContextType>;
  PublicMapColumn?: PublicMapColumnResolvers<ContextType>;
  PublicMapDataSourceConfig?: PublicMapDataSourceConfigResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RecordCount?: RecordCountResolvers<ContextType>;
  RecordFilter?: RecordFilterResolvers<ContextType>;
  RecordsProcessedEvent?: RecordsProcessedEventResolvers<ContextType>;
  Sort?: SortResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Turf?: TurfResolvers<ContextType>;
  UpdateMapConfigResponse?: UpdateMapConfigResponseResolvers<ContextType>;
  UpdateMapResponse?: UpdateMapResponseResolvers<ContextType>;
  UpdateUserResponse?: UpdateUserResponseResolvers<ContextType>;
  UpsertFolderResponse?: UpsertFolderResponseResolvers<ContextType>;
  UpsertMapViewResponse?: UpsertMapViewResponseResolvers<ContextType>;
  UpsertPlacedMarkerResponse?: UpsertPlacedMarkerResponseResolvers<ContextType>;
  UpsertPublicMapResponse?: UpsertPublicMapResponseResolvers<ContextType>;
  UpsertTurfResponse?: UpsertTurfResponseResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = GraphQLContext> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
};
