const typeDefs = `
  directive @auth(read: ArgNames, write: ArgNames) on FIELD_DEFINITION

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

  input ArgNames {
    dataSourceIdArg: String
    organisationIdArg: String
  }

  input LooseGeocodingConfigInput {
    type: GeocodingType!
    column: String
    areaSetCode: AreaSetCode
  }

  input LooseEnrichmentInput {
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

  type ColumnRoles {
    nameColumn: String
  }

  type DataSource {
    id: String!
    name: String!
    autoEnrich: Boolean!
    autoImport: Boolean!
    createdAt: String!
    columnDefs: [ColumnDef!]!
    config: JSON!
    columnRoles: ColumnRoles!
    enrichments: [LooseEnrichment!]!
    geocodingConfig: LooseGeocodingConfig!

    enrichmentDataSources: [EnrichmentDataSource!]
    enrichmentInfo: JobInfo
    importInfo: JobInfo

    recordCount: Int
  }

  """
  Used to display a list of connected sources
  in the data source dashboard.
  """
  type EnrichmentDataSource {
    id: String!
    name: String!
  }

  type JobInfo {
    lastCompleted: String
    status: JobStatus
  }

  """
  GraphQL doesn't have discriminated union types like Typescript.
  Instead, Loose types contain all possible properties, and data
  should be validated with the corresponding Zod type before use.
  """
  type LooseGeocodingConfig {
    type: GeocodingType!
    column: String
    areaSetCode: AreaSetCode
  }

  type LooseEnrichment {
    sourceType: EnrichmentSourceType!
    areaSetCode: AreaSetCode
    areaProperty: String
    dataSourceId: String
    dataSourceColumn: String
  }

  type Organisation {
    id: String!
    name: String!
  }

  type Query {
    areaStats(
      areaSetCode: AreaSetCode!
      dataSourceId: String!
      column: String!
      operation: Operation!
      excludeColumns: [String!]!
      boundingBox: BoundingBoxInput
    ): AreaStats @auth(read: { dataSourceIdArg: "dataSourceId" })

    dataSource(id: String!): DataSource @auth(read: { dataSourceIdArg: "id" })
    dataSources(organisationId: String): [DataSource!] @auth

    organisations: [Organisation!] @auth
  }

  type CreateDataSourceResponse {
    code: Int!
    result: DataSource
  }

  type MutationResponse {
    code: Int!
  }

  type Mutation {
    createDataSource(
      name: String!
      organisationId: String!
      rawConfig: JSON!
    ): CreateDataSourceResponse @auth(read: { organisationIdArg: "organisationId" })
    enqueueEnrichDataSourceJob(dataSourceId: String!): MutationResponse @auth(read: { dataSourceIdArg: "dataSourceId" })
    enqueueImportDataSourceJob(dataSourceId: String!): MutationResponse @auth(read: { dataSourceIdArg: "dataSourceId" })
    updateDataSourceConfig(
      id: String!
      autoEnrich: Boolean
      autoImport: Boolean
      columnRoles: ColumnRolesInput
      looseGeocodingConfig: LooseGeocodingConfigInput
      looseEnrichments: [LooseEnrichmentInput!]
    ): MutationResponse @auth(write: { dataSourceIdArg: "id" })
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
    dataSourceEvent(dataSourceId: String!): DataSourceEvent @auth(read: { dataSourceIdArg: "dataSourceId" })
  }
`;

export default typeDefs;
