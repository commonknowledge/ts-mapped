const typeDefs = `
  directive @auth(read: ArgNames, write: ArgNames) on FIELD_DEFINITION

  scalar Date
  scalar JSON

  enum AreaSetCode {
    OA21
    PC
    MSOA21
    WMC24
  }

  enum AreaSetGroupCode {
    OA21
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

  enum MapStyleName {
    Light
    Dark
    Streets
    Satellite
  }

  enum Operation {
    AVG
    SUM
  }

  input ArgNames {
    dataSourceIdArg: String
    mapIdArg: String
    organisationIdArg: String
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

  input MapInput {
    name: String
    imageUrl: String
  }

  input MapViewConfigInput {
    areaDataSourceId: String
    areaDataColumn: String
    areaSetGroupCode: AreaSetGroupCode
    excludeColumnsString: String
    markerDataSourceIds: [String]
    membersDataSourceId: String
    mapStyleName: MapStyleName
    showBoundaryOutline: Boolean
    showLabels: Boolean
    showLocations: Boolean
    showMembers: Boolean
    showTurf: Boolean
  }

  input PointInput {
    lat: Float!
    lng: Float!
  }

  input SortInput {
    name: String!
    desc: Boolean!
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

  type DataRecord {
    id: String!
    externalId: String!
    json: JSON!
    geocodePoint: Point
  }

  type DataSource {
    id: String!
    name: String!
    autoEnrich: Boolean!
    autoImport: Boolean!
    createdAt: Date!
    columnDefs: [ColumnDef!]!
    config: JSON!
    columnRoles: ColumnRoles!
    enrichments: [LooseEnrichment!]!
    geocodingConfig: LooseGeocodingConfig!

    enrichmentDataSources: [EnrichmentDataSource!]
    enrichmentInfo: JobInfo
    importInfo: JobInfo

    records(filter: String, page: Int, sort: [SortInput!]): [DataRecord!]

    recordCount(filter: String, sort: [SortInput!]): Int
  }

  """
  Used to display a list of connected sources
  in the data source dashboard.
  """
  type EnrichmentDataSource {
    id: String!
    name: String!
  }

  type Folder {
    id: String!
    name: String!
    notes: String!
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

  type Map {
    id: String!
    name: String!
    createdAt: Date!
    imageUrl: String
    folders: [Folder!]
    placedMarkers: [PlacedMarker!]
    turfs: [Turf!]
    views: [MapView!]
  }

  type MapViewConfig {
    areaDataSourceId: String!
    areaDataColumn: String!
    areaSetGroupCode: AreaSetGroupCode
    excludeColumnsString: String!
    markerDataSourceIds: [String!]!
    membersDataSourceId: String!
    mapStyleName: MapStyleName!
    showBoundaryOutline: Boolean!
    showLabels: Boolean!
    showLocations: Boolean!
    showMembers: Boolean!
    showTurf: Boolean!
  }

  type MapView {
    id: String!
    config: MapViewConfig!
    mapId: String!
  }

  type Organisation {
    id: String!
    name: String!
  }

  type PlacedMarker {
    id: String!
    label: String!
    notes: String!
    point: Point!
    folderId: String
    position: Float!
  }

  type Point {
    lat: Float!
    lng: Float!
  }

  type Turf {
    id: String!
    label: String!
    notes: String!
    area: Float!
    geometry: JSON!
    createdAt: Date!
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

    map(id: String!): Map @auth(read: { mapIdArg: "id" })
    maps(organisationId: String!): [Map!] @auth(read: { organisationIdArg: "organisationId" })
    organisations: [Organisation!] @auth
  }

  type CreateDataSourceResponse {
    code: Int!
    result: DataSource
  }

  type CreateMapResponse {
    code: Int!
    result: Map
  }

  type MutationResponse {
    code: Int!
  }

  type UpdateMapResponse {
    code: Int!
    result: Map
  }

  type UpsertMapViewResponse {
    code: Int!
    result: String
  }

  type UpsertFolderResponse {
    code: Int!
    result: Folder
  }

  type UpsertPlacedMarkerResponse {
    code: Int!
    result: PlacedMarker
  }

  type UpsertTurfResponse {
    code: Int!
    result: Turf
  }

  type Mutation {
    createDataSource(
      name: String!
      organisationId: String!
      rawConfig: JSON!
    ): CreateDataSourceResponse @auth(read: { organisationIdArg: "organisationId" })
    createMap(organisationId: String!): CreateMapResponse @auth(read: { organisationIdArg: "organisationId" })
    deleteFolder(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
    deletePlacedMarker(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
    deleteTurf(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
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
    deleteMap(id: String!): MutationResponse @auth(write: { mapIdArg: "id" })
    updateMap(
      id: String!
      map: MapInput!
    ): UpdateMapResponse @auth(write: { mapIdArg: "id" })
    upsertMapView(
      id: String
      config: MapViewConfigInput!
      mapId: String!
    ): UpsertMapViewResponse @auth(write: { mapIdArg: "mapId" })
     upsertFolder(
      id: String!
      name: String!
      notes: String!
      mapId: String!
    ): UpsertFolderResponse @auth(write: { mapIdArg: "mapId" })
    upsertPlacedMarker(
      id: String!
      label: String!
      notes: String!
      point: PointInput!
      mapId: String!
      folderId: String
      position: Float!
    ): UpsertPlacedMarkerResponse @auth(write: { mapIdArg: "mapId" })
    upsertTurf(
      id: String
      label: String!
      notes: String!
      area: Float!
      geometry: JSON!
      createdAt: Date!
      mapId: String!
    ): UpsertTurfResponse @auth(write: { mapIdArg: "mapId" })
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
