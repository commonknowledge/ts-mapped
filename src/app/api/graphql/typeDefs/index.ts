const typeDefs = `
  scalar JSON

  enum AreaSetCode {
    OA21
    PC
    MSOA21
    WMC24
  }

  enum ColumnType {
    Empty
    Boolean
    Object
    Number
    String
    Unknown
  }

  enum EnrichmentSourceType {
    Area
    DataSource
  }

  enum GeocodingType {
    Address
    Code
    Name
    None
  }

  enum JobStatus {
    None
    Failed
    Running
    Complete
    Pending
  }

  enum Operation {
    AVG
    SUM
  }

  input BoundingBoxInput {
    north: Float!
    east: Float!
    south: Float!
    west: Float!
  }

  input ColumnRolesInput {
    nameColumn: String!
  }

  input MixedGeocodingConfigInput {
    type: GeocodingType!
    column: String
    areaSetCode: AreaSetCode
  }

  input MixedEnrichmentInput {
    sourceType: EnrichmentSourceType!
    areaSetCode: AreaSetCode
    areaProperty: String
    dataSourceId: String
    dataSourceColumn: String
  }

  type AreaStat {
    areaCode: String!
    value: JSON!
  }

  type AreaStats {
    column: String!
    columnType: ColumnType!
    stats: [AreaStat!]!
  }

  type ColumnDef {
    name: String!
    type: ColumnType!
  }

  type DataSource {
    id: String!
    name: String!
    createdAt: String!
    columnDefs: [ColumnDef!]!
    config: JSON!
    columnRoles: ColumnRoles!
    enrichments: [MixedEnrichment!]!
    geocodingConfig: MixedGeocodingConfig!

    enrichmentDataSources: [DataSource!]
    enrichmentInfo: JobInfo
    importInfo: JobInfo

    """
    markers is untyped for performance - objects are
    denormalized in the Apollo client cache, which is slow
    (and unnecessary) for 100,000+ markers.
    """
    markers: JSON

    recordCount: Int
  }

  type ColumnRoles {
    nameColumn: String
  }

  type JobInfo {
    lastCompleted: String
    status: JobStatus
  }

  """
  GraphQL doesn't have discriminated union types like Typescript.
  Instead, Mixed types contain all possible properties, and data
  should be validated with the corresponding Zod type before use.
  """
  type MixedGeocodingConfig {
    type: GeocodingType!
    column: String
    areaSetCode: AreaSetCode
  }

  type MixedEnrichment {
    sourceType: EnrichmentSourceType!
    areaSetCode: AreaSetCode
    areaProperty: String
    dataSourceId: String
    dataSourceColumn: String
  }

  type Query {
    areaStats(
      areaSetCode: AreaSetCode!
      dataSourceId: String!
      column: String!
      operation: Operation!
      excludeColumns: [String!]!
      boundingBox: BoundingBoxInput
    ): AreaStats!

    dataSource(id: String!): DataSource
    dataSources: [DataSource!]!
  }

  type CreateDataSourceResponse {
    code: Int!
    result: DataSource
  }

  type MutationResponse {
    code: Int!
  }

  type Mutation {
    createDataSource(name: String!, rawConfig: JSON!): CreateDataSourceResponse!
    enqueueEnrichDataSourceJob(dataSourceId: String!): MutationResponse!
    enqueueImportDataSourceJob(dataSourceId: String!): MutationResponse!
    updateDataSourceConfig(
      id: String!
      columnRoles: ColumnRolesInput
      mixedGeocodingConfig: MixedGeocodingConfigInput
      mixedEnrichments: [MixedEnrichmentInput!]
    ): MutationResponse!
  }

  type DataSourceEvent {
    dataSourceId: String!

    enrichmentComplete: JobCompleteEvent
    enrichmentFailed: JobFailedEvent

    importComplete: JobCompleteEvent
    importFailed: JobFailedEvent

    recordsEnriched: RecordsProcessedEvent
    recordsImported: RecordsProcessedEvent
  }

  type JobCompleteEvent {
    at: String!
  }

  type JobFailedEvent {
    at: String!
  }

  type RecordsProcessedEvent {
    at: String!
    count: Int!
  }

  type Subscription {
    dataSourceEvent(dataSourceId: String!): DataSourceEvent!
  }
`;

export default typeDefs;
