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

export enum ColumnType {
  Boolean = "boolean",
  Empty = "empty",
  Number = "number",
  Object = "object",
  String = "string",
  Unknown = "unknown",
}

export type ColumnsConfig = {
  __typename?: "ColumnsConfig";
  nameColumn: Scalars["String"]["output"];
};

export type ColumnsConfigInput = {
  nameColumn: Scalars["String"]["input"];
};

export type CreateDataSourceResponse = {
  __typename?: "CreateDataSourceResponse";
  code: Scalars["Int"]["output"];
  result?: Maybe<DataSource>;
};

export type DataSource = {
  __typename?: "DataSource";
  columnDefs: Array<ColumnDef>;
  columnsConfig: ColumnsConfig;
  config: Scalars["JSON"]["output"];
  createdAt: Scalars["String"]["output"];
  geocodingConfig: Scalars["JSON"]["output"];
  id: Scalars["String"]["output"];
  importInfo?: Maybe<ImportInfo>;
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
  importComplete?: Maybe<ImportCompleteEvent>;
  importFailed?: Maybe<ImportFailedEvent>;
  recordsImported?: Maybe<RecordsImportedEvent>;
};

export type ImportCompleteEvent = {
  __typename?: "ImportCompleteEvent";
  at: Scalars["String"]["output"];
};

export type ImportFailedEvent = {
  __typename?: "ImportFailedEvent";
  at: Scalars["String"]["output"];
};

export type ImportInfo = {
  __typename?: "ImportInfo";
  lastImported?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<ImportStatus>;
};

export enum ImportStatus {
  Failed = "Failed",
  Imported = "Imported",
  Importing = "Importing",
  None = "None",
  Pending = "Pending",
}

export type Mutation = {
  __typename?: "Mutation";
  createDataSource: CreateDataSourceResponse;
  enqueueImportDataSourceJob: MutationResponse;
  updateDataSourceConfig: MutationResponse;
};

export type MutationCreateDataSourceArgs = {
  name: Scalars["String"]["input"];
  rawConfig: Scalars["JSON"]["input"];
};

export type MutationEnqueueImportDataSourceJobArgs = {
  dataSourceId: Scalars["String"]["input"];
};

export type MutationUpdateDataSourceConfigArgs = {
  columnsConfig: ColumnsConfigInput;
  id: Scalars["String"]["input"];
  rawGeocodingConfig: Scalars["JSON"]["input"];
};

export type MutationResponse = {
  __typename?: "MutationResponse";
  code: Scalars["Int"]["output"];
};

export enum Operation {
  Avg = "AVG",
  Sum = "SUM",
}

export type Query = {
  __typename?: "Query";
  areaStats: AreaStats;
  dataSource?: Maybe<DataSource>;
  dataSources: Array<DataSource>;
};

export type QueryAreaStatsArgs = {
  areaSetCode: Scalars["String"]["input"];
  boundingBox?: InputMaybe<BoundingBoxInput>;
  column: Scalars["String"]["input"];
  dataSourceId: Scalars["String"]["input"];
  excludeColumns: Array<Scalars["String"]["input"]>;
  operation: Operation;
};

export type QueryDataSourceArgs = {
  id: Scalars["String"]["input"];
};

export type RecordsImportedEvent = {
  __typename?: "RecordsImportedEvent";
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
    importComplete?: { __typename?: "ImportCompleteEvent"; at: string } | null;
    importFailed?: { __typename?: "ImportFailedEvent"; at: string } | null;
    recordsImported?: {
      __typename?: "RecordsImportedEvent";
      count: number;
    } | null;
  };
};

export type UpdateDataSourceConfigMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  columnsConfig: ColumnsConfigInput;
  rawGeocodingConfig: Scalars["JSON"]["input"];
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
    geocodingConfig: any;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnsConfig: { __typename?: "ColumnsConfig"; nameColumn: string };
  } | null;
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
    geocodingConfig: any;
    recordCount?: number | null;
    columnDefs: Array<{
      __typename?: "ColumnDef";
      name: string;
      type: ColumnType;
    }>;
    columnsConfig: { __typename?: "ColumnsConfig"; nameColumn: string };
    importInfo?: {
      __typename?: "ImportInfo";
      lastImported?: string | null;
      status?: ImportStatus | null;
    } | null;
  } | null;
};

export type CreateDataSourceMutationVariables = Exact<{
  name: Scalars["String"]["input"];
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
  areaSetCode: Scalars["String"]["input"];
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
  AreaStat: ResolverTypeWrapper<AreaStat>;
  AreaStats: ResolverTypeWrapper<AreaStats>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  BoundingBoxInput: BoundingBoxInput;
  ColumnDef: ResolverTypeWrapper<ColumnDef>;
  ColumnType: ColumnType;
  ColumnsConfig: ResolverTypeWrapper<ColumnsConfig>;
  ColumnsConfigInput: ColumnsConfigInput;
  CreateDataSourceResponse: ResolverTypeWrapper<CreateDataSourceResponse>;
  DataSource: ResolverTypeWrapper<DataSource>;
  DataSourceEvent: ResolverTypeWrapper<DataSourceEvent>;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  ImportCompleteEvent: ResolverTypeWrapper<ImportCompleteEvent>;
  ImportFailedEvent: ResolverTypeWrapper<ImportFailedEvent>;
  ImportInfo: ResolverTypeWrapper<ImportInfo>;
  ImportStatus: ImportStatus;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponse: ResolverTypeWrapper<MutationResponse>;
  Operation: Operation;
  Query: ResolverTypeWrapper<{}>;
  RecordsImportedEvent: ResolverTypeWrapper<RecordsImportedEvent>;
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
  ColumnsConfig: ColumnsConfig;
  ColumnsConfigInput: ColumnsConfigInput;
  CreateDataSourceResponse: CreateDataSourceResponse;
  DataSource: DataSource;
  DataSourceEvent: DataSourceEvent;
  Float: Scalars["Float"]["output"];
  ImportCompleteEvent: ImportCompleteEvent;
  ImportFailedEvent: ImportFailedEvent;
  ImportInfo: ImportInfo;
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  Mutation: {};
  MutationResponse: MutationResponse;
  Query: {};
  RecordsImportedEvent: RecordsImportedEvent;
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

export type ColumnsConfigResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ColumnsConfig"] = ResolversParentTypes["ColumnsConfig"],
> = {
  nameColumn?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
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
  columnsConfig?: Resolver<
    ResolversTypes["ColumnsConfig"],
    ParentType,
    ContextType
  >;
  config?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  geocodingConfig?: Resolver<ResolversTypes["JSON"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  importInfo?: Resolver<
    Maybe<ResolversTypes["ImportInfo"]>,
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
  importComplete?: Resolver<
    Maybe<ResolversTypes["ImportCompleteEvent"]>,
    ParentType,
    ContextType
  >;
  importFailed?: Resolver<
    Maybe<ResolversTypes["ImportFailedEvent"]>,
    ParentType,
    ContextType
  >;
  recordsImported?: Resolver<
    Maybe<ResolversTypes["RecordsImportedEvent"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ImportCompleteEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ImportCompleteEvent"] = ResolversParentTypes["ImportCompleteEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ImportFailedEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ImportFailedEvent"] = ResolversParentTypes["ImportFailedEvent"],
> = {
  at?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ImportInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["ImportInfo"] = ResolversParentTypes["ImportInfo"],
> = {
  lastImported?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<
    Maybe<ResolversTypes["ImportStatus"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = {
  createDataSource?: Resolver<
    ResolversTypes["CreateDataSourceResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateDataSourceArgs, "name" | "rawConfig">
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
    RequireFields<
      MutationUpdateDataSourceConfigArgs,
      "columnsConfig" | "id" | "rawGeocodingConfig"
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
};

export type RecordsImportedEventResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["RecordsImportedEvent"] = ResolversParentTypes["RecordsImportedEvent"],
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
  ColumnsConfig?: ColumnsConfigResolvers<ContextType>;
  CreateDataSourceResponse?: CreateDataSourceResponseResolvers<ContextType>;
  DataSource?: DataSourceResolvers<ContextType>;
  DataSourceEvent?: DataSourceEventResolvers<ContextType>;
  ImportCompleteEvent?: ImportCompleteEventResolvers<ContextType>;
  ImportFailedEvent?: ImportFailedEventResolvers<ContextType>;
  ImportInfo?: ImportInfoResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponse?: MutationResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RecordsImportedEvent?: RecordsImportedEventResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
};
