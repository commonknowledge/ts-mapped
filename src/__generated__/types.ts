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
  JSON: { input: any; output: any };
};

export enum AreaSetCode {
  MSOA21 = "MSOA21",
  OA21 = "OA21",
  PC = "PC",
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

export type DataSource = {
  __typename?: "DataSource";
  columnDefs: Array<ColumnDef>;
  columnRoles: ColumnRoles;
  config: Scalars["JSON"]["output"];
  createdAt: Scalars["String"]["output"];
  enrichmentDataSources?: Maybe<Array<DataSource>>;
  enrichmentInfo?: Maybe<JobInfo>;
  enrichments: Array<LooseEnrichment>;
  geocodingConfig: LooseGeocodingConfig;
  id: Scalars["String"]["output"];
  importInfo?: Maybe<JobInfo>;
  /**
   * markers is untyped for performance - objects are
   * denormalized in the Apollo client cache, which is slow
   * (and unnecessary) for 100,000+ markers.
   */
  markers?: Maybe<Scalars["JSON"]["output"]>;
  name: Scalars["String"]["output"];
  recordCount?: Maybe<Scalars["Int"]["output"]>;
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

export enum EnrichmentSourceType {
  Area = "Area",
  DataSource = "DataSource",
}

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

export type Mutation = {
  __typename?: "Mutation";
  createDataSource: CreateDataSourceResponse;
  enqueueEnrichDataSourceJob: MutationResponse;
  enqueueImportDataSourceJob: MutationResponse;
  updateDataSourceConfig: MutationResponse;
};

export type MutationCreateDataSourceArgs = {
  name: Scalars["String"]["input"];
  organisationId: Scalars["String"]["input"];
  rawConfig: Scalars["JSON"]["input"];
};

export type MutationEnqueueEnrichDataSourceJobArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type MutationEnqueueImportDataSourceJobArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type MutationUpdateDataSourceConfigArgs = {
  columnRoles?: InputMaybe<ColumnRolesInput>;
  id: Scalars["String"]["input"];
  looseEnrichments?: InputMaybe<Array<LooseEnrichmentInput>>;
  looseGeocodingConfig?: InputMaybe<LooseGeocodingConfigInput>;
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

export type Query = {
  __typename?: "Query";
  areaStats: AreaStats;
  dataSource?: Maybe<DataSource>;
  dataSources: Array<DataSource>;
  organisations: Array<Organisation>;
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

export type RecordsProcessedEvent = {
  __typename?: "RecordsProcessedEvent";
  at: Scalars["String"]["output"];
  count: Scalars["Int"]["output"];
};

export type Subscription = {
  __typename?: "Subscription";
  dataSourceEvent: DataSourceEvent;
};

export type SubscriptionDataSourceEventArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type EnqueueImportDataSourceJobMutationVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type EnqueueImportDataSourceJobMutation = {
  __typename?: "Mutation";
  enqueueImportDataSourceJob: { __typename?: "MutationResponse"; code: number };
};

export type DataSourceEventSubscriptionVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type DataSourceEventSubscription = {
  __typename?: "Subscription";
  dataSourceEvent: {
    __typename?: "DataSourceEvent";
    importComplete?: { __typename?: "JobCompleteEvent"; at: string } | null;
    importFailed?: { __typename?: "JobFailedEvent"; at: string } | null;
    recordsImported?: {
      __typename?: "RecordsProcessedEvent";
      count: number;
    } | null;
  };
};

export type EnqueueEnrichDataSourceJobMutationVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type EnqueueEnrichDataSourceJobMutation = {
  __typename?: "Mutation";
  enqueueEnrichDataSourceJob: { __typename?: "MutationResponse"; code: number };
};

export type DataSourceEnrichmentEventSubscriptionVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type DataSourceEnrichmentEventSubscription = {
  __typename?: "Subscription";
  dataSourceEvent: {
    __typename?: "DataSourceEvent";
    enrichmentComplete?: { __typename?: "JobCompleteEvent"; at: string } | null;
    enrichmentFailed?: { __typename?: "JobFailedEvent"; at: string } | null;
    recordsEnriched?: {
      __typename?: "RecordsProcessedEvent";
      count: number;
    } | null;
  };
};

export type UpdateDataSourceConfigMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  columnRoles: ColumnRolesInput;
  looseGeocodingConfig?: InputMaybe<LooseGeocodingConfigInput>;
}>;

export type UpdateDataSourceConfigMutation = {
  __typename?: "Mutation";
  updateDataSourceConfig: { __typename?: "MutationResponse"; code: number };
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
  updateDataSourceConfig: { __typename?: "MutationResponse"; code: number };
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
  dataSources: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    columnDefs: Array<{ __typename?: "ColumnDef"; name: string }>;
  }>;
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
      __typename?: "DataSource";
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
  createDataSource: {
    __typename?: "CreateDataSourceResponse";
    code: number;
    result?: { __typename?: "DataSource"; id: string } | null;
  };
};

export type ListDataSourcesQueryVariables = Exact<{ [key: string]: never }>;

export type ListDataSourcesQuery = {
  __typename?: "Query";
  dataSources: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    config: any;
    createdAt: string;
  }>;
};

export type DataSourcesQueryVariables = Exact<{ [key: string]: never }>;

export type DataSourcesQuery = {
  __typename?: "Query";
  dataSources: Array<{
    __typename?: "DataSource";
    id: string;
    name: string;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
  }>;
};

export type MarkersQueryVariables = Exact<{
  dataSourceId: Scalars["String"]["input"];
}>;

export type MarkersQuery = {
  __typename?: "Query";
  dataSource?: {
    __typename?: "DataSource";
    name: string;
    markers?: any | null;
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
  areaStats: {
    __typename?: "AreaStats";
    column: string;
    columnType: ColumnType;
    stats: Array<{ __typename?: "AreaStat"; areaCode: string; value: any }>;
  };
};

export type ListOrganisationsQueryVariables = Exact<{ [key: string]: never }>;

export type ListOrganisationsQuery = {
  __typename?: "Query";
  organisations: Array<{
    __typename?: "Organisation";
    id: string;
    name: string;
  }>;
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
  AreaStat: ResolverTypeWrapper<AreaStat>;
  AreaStats: ResolverTypeWrapper<AreaStats>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  BoundingBoxInput: BoundingBoxInput;
  ColumnDef: ResolverTypeWrapper<ColumnDef>;
  ColumnRoles: ResolverTypeWrapper<ColumnRoles>;
  ColumnRolesInput: ColumnRolesInput;
  ColumnType: ColumnType;
  CreateDataSourceResponse: ResolverTypeWrapper<CreateDataSourceResponse>;
  DataSource: ResolverTypeWrapper<DataSource>;
  DataSourceEvent: ResolverTypeWrapper<DataSourceEvent>;
  EnrichmentSourceType: EnrichmentSourceType;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
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
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponse: ResolverTypeWrapper<MutationResponse>;
  Operation: Operation;
  Organisation: ResolverTypeWrapper<Organisation>;
  Query: ResolverTypeWrapper<{}>;
  RecordsProcessedEvent: ResolverTypeWrapper<RecordsProcessedEvent>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  Subscription: ResolverTypeWrapper<{}>;
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
  DataSource: DataSource;
  DataSourceEvent: DataSourceEvent;
  Float: Scalars["Float"]["output"];
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  JobCompleteEvent: JobCompleteEvent;
  JobFailedEvent: JobFailedEvent;
  JobInfo: JobInfo;
  LooseEnrichment: LooseEnrichment;
  LooseEnrichmentInput: LooseEnrichmentInput;
  LooseGeocodingConfig: LooseGeocodingConfig;
  LooseGeocodingConfigInput: LooseGeocodingConfigInput;
  Mutation: {};
  MutationResponse: MutationResponse;
  Organisation: Organisation;
  Query: {};
  RecordsProcessedEvent: RecordsProcessedEvent;
  String: Scalars["String"]["output"];
  Subscription: {};
};

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

export type DataSourceResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["DataSource"] = ResolversParentTypes["DataSource"],
> = {
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
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  enrichmentDataSources?: Resolver<
    Maybe<Array<ResolversTypes["DataSource"]>>,
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
  markers?: Resolver<Maybe<ResolversTypes["JSON"]>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  recordCount?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
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

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = {
  createDataSource?: Resolver<
    ResolversTypes["CreateDataSourceResponse"],
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateDataSourceArgs,
      "name" | "organisationId" | "rawConfig"
    >
  >;
  enqueueEnrichDataSourceJob?: Resolver<
    ResolversTypes["MutationResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationEnqueueEnrichDataSourceJobArgs, "dataSourceId">
  >;
  enqueueImportDataSourceJob?: Resolver<
    ResolversTypes["MutationResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationEnqueueImportDataSourceJobArgs, "dataSourceId">
  >;
  updateDataSourceConfig?: Resolver<
    ResolversTypes["MutationResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateDataSourceConfigArgs, "id">
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

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = {
  areaStats?: Resolver<
    ResolversTypes["AreaStats"],
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
    Array<ResolversTypes["DataSource"]>,
    ParentType,
    ContextType
  >;
  organisations?: Resolver<
    Array<ResolversTypes["Organisation"]>,
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
    ResolversTypes["DataSourceEvent"],
    "dataSourceEvent",
    ParentType,
    ContextType,
    RequireFields<SubscriptionDataSourceEventArgs, "dataSourceId">
  >;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AreaStat?: AreaStatResolvers<ContextType>;
  AreaStats?: AreaStatsResolvers<ContextType>;
  ColumnDef?: ColumnDefResolvers<ContextType>;
  ColumnRoles?: ColumnRolesResolvers<ContextType>;
  CreateDataSourceResponse?: CreateDataSourceResponseResolvers<ContextType>;
  DataSource?: DataSourceResolvers<ContextType>;
  DataSourceEvent?: DataSourceEventResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobCompleteEvent?: JobCompleteEventResolvers<ContextType>;
  JobFailedEvent?: JobFailedEventResolvers<ContextType>;
  JobInfo?: JobInfoResolvers<ContextType>;
  LooseEnrichment?: LooseEnrichmentResolvers<ContextType>;
  LooseGeocodingConfig?: LooseGeocodingConfigResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponse?: MutationResponseResolvers<ContextType>;
  Organisation?: OrganisationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RecordsProcessedEvent?: RecordsProcessedEventResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
};
