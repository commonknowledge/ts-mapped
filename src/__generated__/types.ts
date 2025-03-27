import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../app/api/graphql/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type AreaStat = {
  __typename?: 'AreaStat';
  areaCode: Scalars['String']['output'];
  value: Scalars['JSON']['output'];
};

export type AreaStats = {
  __typename?: 'AreaStats';
  column: Scalars['String']['output'];
  columnType: ColumnType;
  stats: Array<AreaStat>;
};

export type BoundingBox = {
  east: Scalars['Float']['input'];
  north: Scalars['Float']['input'];
  south: Scalars['Float']['input'];
  west: Scalars['Float']['input'];
};

export type ColumnDef = {
  __typename?: 'ColumnDef';
  name: Scalars['String']['output'];
  type: ColumnType;
};

export enum ColumnType {
  Boolean = 'boolean',
  Empty = 'empty',
  Number = 'number',
  Object = 'object',
  String = 'string',
  Unknown = 'unknown'
}

export type CreateDataSourceResponse = {
  __typename?: 'CreateDataSourceResponse';
  code: Scalars['Int']['output'];
  result?: Maybe<DataSource>;
};

export type DataSource = {
  __typename?: 'DataSource';
  columnDefs: Array<ColumnDef>;
  config: Scalars['JSON']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type GeoJson = {
  __typename?: 'GeoJSON';
  features: Array<GeoJsonFeature>;
  type: GeoJsonType;
};

export type GeoJsonFeature = {
  __typename?: 'GeoJSONFeature';
  geometry: GeoJsonGeometry;
  properties: Scalars['JSON']['output'];
  type: GeoJsonFeatureType;
};

export enum GeoJsonFeatureType {
  Feature = 'Feature'
}

export type GeoJsonGeometry = {
  __typename?: 'GeoJSONGeometry';
  coordinates: Array<Scalars['Float']['output']>;
  type: GeoJsonGeometryType;
};

export enum GeoJsonGeometryType {
  Point = 'Point'
}

export enum GeoJsonType {
  FeatureCollection = 'FeatureCollection'
}

export type Mutation = {
  __typename?: 'Mutation';
  createDataSource: CreateDataSourceResponse;
  triggerImportDataSourceJob: MutationResponse;
};


export type MutationCreateDataSourceArgs = {
  name: Scalars['String']['input'];
  rawConfig: Scalars['JSON']['input'];
  rawGeocodingConfig: Scalars['JSON']['input'];
};


export type MutationTriggerImportDataSourceJobArgs = {
  dataSourceId: Scalars['String']['input'];
};

export type MutationResponse = {
  __typename?: 'MutationResponse';
  code: Scalars['Int']['output'];
};

export enum Operation {
  Avg = 'AVG',
  Sum = 'SUM'
}

export type Query = {
  __typename?: 'Query';
  areaStats: AreaStats;
  dataSource?: Maybe<DataSource>;
  dataSources: Array<DataSource>;
  markers: GeoJson;
};


export type QueryAreaStatsArgs = {
  areaSetCode: Scalars['String']['input'];
  boundingBox?: InputMaybe<BoundingBox>;
  column: Scalars['String']['input'];
  dataSourceId: Scalars['String']['input'];
  excludeColumns: Array<Scalars['String']['input']>;
  operation: Operation;
};


export type QueryDataSourceArgs = {
  id: Scalars['String']['input'];
};


export type QueryMarkersArgs = {
  dataSourceId: Scalars['String']['input'];
};

export type ListDataSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListDataSourcesQuery = { __typename?: 'Query', dataSources: Array<{ __typename?: 'DataSource', id: string, name: string, config: any, createdAt: string }> };

export type DataSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type DataSourcesQuery = { __typename?: 'Query', dataSources: Array<{ __typename?: 'DataSource', id: string, name: string, columnDefs: Array<{ __typename?: 'ColumnDef', name: string, type: ColumnType }> }> };

export type MarkersQueryVariables = Exact<{
  dataSourceId: Scalars['String']['input'];
}>;


export type MarkersQuery = { __typename?: 'Query', markers: { __typename?: 'GeoJSON', type: GeoJsonType, features: Array<{ __typename?: 'GeoJSONFeature', type: GeoJsonFeatureType, properties: any, geometry: { __typename?: 'GeoJSONGeometry', type: GeoJsonGeometryType, coordinates: Array<number> } }> } };

export type AreaStatsQueryVariables = Exact<{
  areaSetCode: Scalars['String']['input'];
  dataSourceId: Scalars['String']['input'];
  column: Scalars['String']['input'];
  operation: Operation;
  excludeColumns: Array<Scalars['String']['input']> | Scalars['String']['input'];
  boundingBox?: InputMaybe<BoundingBox>;
}>;


export type AreaStatsQuery = { __typename?: 'Query', areaStats: { __typename?: 'AreaStats', column: string, columnType: ColumnType, stats: Array<{ __typename?: 'AreaStat', areaCode: string, value: any }> } };



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AreaStat: ResolverTypeWrapper<AreaStat>;
  AreaStats: ResolverTypeWrapper<AreaStats>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BoundingBox: BoundingBox;
  ColumnDef: ResolverTypeWrapper<ColumnDef>;
  ColumnType: ColumnType;
  CreateDataSourceResponse: ResolverTypeWrapper<CreateDataSourceResponse>;
  DataSource: ResolverTypeWrapper<DataSource>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GeoJSON: ResolverTypeWrapper<GeoJson>;
  GeoJSONFeature: ResolverTypeWrapper<GeoJsonFeature>;
  GeoJSONFeatureType: GeoJsonFeatureType;
  GeoJSONGeometry: ResolverTypeWrapper<GeoJsonGeometry>;
  GeoJSONGeometryType: GeoJsonGeometryType;
  GeoJSONType: GeoJsonType;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponse: ResolverTypeWrapper<MutationResponse>;
  Operation: Operation;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AreaStat: AreaStat;
  AreaStats: AreaStats;
  Boolean: Scalars['Boolean']['output'];
  BoundingBox: BoundingBox;
  ColumnDef: ColumnDef;
  CreateDataSourceResponse: CreateDataSourceResponse;
  DataSource: DataSource;
  Float: Scalars['Float']['output'];
  GeoJSON: GeoJson;
  GeoJSONFeature: GeoJsonFeature;
  GeoJSONGeometry: GeoJsonGeometry;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: {};
  MutationResponse: MutationResponse;
  Query: {};
  String: Scalars['String']['output'];
};

export type AreaStatResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AreaStat'] = ResolversParentTypes['AreaStat']> = {
  areaCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AreaStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AreaStats'] = ResolversParentTypes['AreaStats']> = {
  column?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  columnType?: Resolver<ResolversTypes['ColumnType'], ParentType, ContextType>;
  stats?: Resolver<Array<ResolversTypes['AreaStat']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ColumnDefResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ColumnDef'] = ResolversParentTypes['ColumnDef']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ColumnType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateDataSourceResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreateDataSourceResponse'] = ResolversParentTypes['CreateDataSourceResponse']> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataSourceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DataSource'] = ResolversParentTypes['DataSource']> = {
  columnDefs?: Resolver<Array<ResolversTypes['ColumnDef']>, ParentType, ContextType>;
  config?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeoJsonResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeoJSON'] = ResolversParentTypes['GeoJSON']> = {
  features?: Resolver<Array<ResolversTypes['GeoJSONFeature']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['GeoJSONType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeoJsonFeatureResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeoJSONFeature'] = ResolversParentTypes['GeoJSONFeature']> = {
  geometry?: Resolver<ResolversTypes['GeoJSONGeometry'], ParentType, ContextType>;
  properties?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['GeoJSONFeatureType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeoJsonGeometryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeoJSONGeometry'] = ResolversParentTypes['GeoJSONGeometry']> = {
  coordinates?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['GeoJSONGeometryType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createDataSource?: Resolver<ResolversTypes['CreateDataSourceResponse'], ParentType, ContextType, RequireFields<MutationCreateDataSourceArgs, 'name' | 'rawConfig' | 'rawGeocodingConfig'>>;
  triggerImportDataSourceJob?: Resolver<ResolversTypes['MutationResponse'], ParentType, ContextType, RequireFields<MutationTriggerImportDataSourceJobArgs, 'dataSourceId'>>;
};

export type MutationResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MutationResponse'] = ResolversParentTypes['MutationResponse']> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  areaStats?: Resolver<ResolversTypes['AreaStats'], ParentType, ContextType, RequireFields<QueryAreaStatsArgs, 'areaSetCode' | 'column' | 'dataSourceId' | 'excludeColumns' | 'operation'>>;
  dataSource?: Resolver<Maybe<ResolversTypes['DataSource']>, ParentType, ContextType, RequireFields<QueryDataSourceArgs, 'id'>>;
  dataSources?: Resolver<Array<ResolversTypes['DataSource']>, ParentType, ContextType>;
  markers?: Resolver<ResolversTypes['GeoJSON'], ParentType, ContextType, RequireFields<QueryMarkersArgs, 'dataSourceId'>>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AreaStat?: AreaStatResolvers<ContextType>;
  AreaStats?: AreaStatsResolvers<ContextType>;
  ColumnDef?: ColumnDefResolvers<ContextType>;
  CreateDataSourceResponse?: CreateDataSourceResponseResolvers<ContextType>;
  DataSource?: DataSourceResolvers<ContextType>;
  GeoJSON?: GeoJsonResolvers<ContextType>;
  GeoJSONFeature?: GeoJsonFeatureResolvers<ContextType>;
  GeoJSONGeometry?: GeoJsonGeometryResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponse?: MutationResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
};

