const typeDefs = `
  directive @auth(read: ProtectedArgs, write: ProtectedArgs) on FIELD_DEFINITION

  input ProtectedArgs {
    dataSourceIdArg: String
    mapIdArg: String
    organisationIdArg: String
    viewIdArg: String
  }

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

  enum CalculationType {
    Value
    Count
    Sum
    Average
  }

  enum ColorScheme {
    RedBlue
    GreenYellowRed
    Viridis
    Plasma
    Diverging
    Sequential
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

  enum FilterOperator {
    AND
    OR
  }

  enum FilterType {
    GEO
    MULTI
    TEXT
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

  enum VisualisationType {
    BoundaryOnly
    Choropleth
  }

  enum PublicMapColumnType {
    CommaSeparatedList
    Boolean
    String
  }

  input BoundingBoxInput {
    north: Float!
    east: Float!
    south: Float!
    west: Float!
  }

  input ColumnRolesInput {
    nameColumns: [String!]!
  }

  enum DataSourceRecordType {
    Members
    People
    Locations
    Events
    Data
    Other
  }

  input DataSourceViewInput {
    dataSourceId: String!
    filter: RecordFilterInput!
    search: String!
    sort: [SortInput!]!
  }

  input LooseGeocodingConfigInput {
    type: GeocodingType!
    column: String
    columns: [String!]
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

  input MapConfigInput {
    markerDataSourceIds: [String]
    membersDataSourceId: String
  }

  input MapViewInput {
    id: String!
    name: String!
    config: MapViewConfigInput!
    dataSourceViews: [DataSourceViewInput!]!
    position: Float!
  }

  input MapViewConfigInput {
    areaDataSourceId: String!
    areaDataColumn: String!
    areaSetGroupCode: AreaSetGroupCode
    excludeColumnsString: String!
    mapStyleName: MapStyleName!
    showBoundaryOutline: Boolean!
    showLabels: Boolean!
    showLocations: Boolean!
    showMembers: Boolean!
    showTurf: Boolean!
    visualisationType: VisualisationType
    calculationType: CalculationType
    colorScheme: ColorScheme
    reverseColorScheme: Boolean
  }

  input PointInput {
    lat: Float!
    lng: Float!
  }

  input PolygonInput {
    type: String!
    coordinates: [[[Float!]!]!]!
  }

  input PublicMapDataSourceConfigInput {
    allowUserEdit: Boolean!
    allowUserSubmit: Boolean!
    dataSourceId: String!
    dataSourceLabel: String!
    formUrl: String!
    nameColumns: [String!]!
    nameLabel: String!
    descriptionColumn: String!
    descriptionLabel: String!
    additionalColumns: [PublicMapColumnInput!]!
  }

  input PublicMapColumnInput {
    label: String!
    sourceColumns: [String!]!
    type: PublicMapColumnType!
  }

  input RecordFilterInput {
    children: [RecordFilterInput!]
    column: String
    dataSourceId: String
    dataRecordId: String
    distance: Int
    label: String
    operator: FilterOperator
    placedMarker: String
    search: String
    turf: String
    type: FilterType!
  }

  type User {
    id: String!
    email: String!
    name: String!
    createdAt: Date!
  }

  input SortInput {
    name: String!
    desc: Boolean!
    location: PointInput
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
    nameColumns: [String!]
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
    public: Boolean!
    recordType: DataSourceRecordType!
    enrichmentDataSources: [EnrichmentDataSource!]
    enrichmentInfo: JobInfo
    importInfo: JobInfo

    records(filter: RecordFilterInput, search: String, page: Int, sort: [SortInput!], all: Boolean): [DataRecord!]

    recordCount(filter: RecordFilterInput, search: String, sort: [SortInput!]): RecordCount
  }

  type DataSourceView {
    dataSourceId: String!
    filter: RecordFilter!
    search: String!
    sort: [Sort!]!
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
    position: Float!
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
    columns: [String!]
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
    config: MapConfig!
    createdAt: Date!
    imageUrl: String
    folders: [Folder!]
    placedMarkers: [PlacedMarker!]
    turfs: [Turf!]
    views: [MapView!]
  }

  type MapConfig {
    markerDataSourceIds: [String!]!
    membersDataSourceId: String
  }

  type MapView {
    id: String!
    name: String!
    position: Float!
    config: MapViewConfig!
    dataSourceViews: [DataSourceView!]!
    mapId: String!
  }

  type MapViewConfig {
    areaDataSourceId: String!
    areaDataColumn: String!
    areaSetGroupCode: AreaSetGroupCode
    excludeColumnsString: String!
    mapStyleName: MapStyleName!
    showBoundaryOutline: Boolean!
    showLabels: Boolean!
    showLocations: Boolean!
    showMembers: Boolean!
    showTurf: Boolean!
    visualisationType: VisualisationType
    calculationType: CalculationType
    colorScheme: ColorScheme
    reverseColorScheme: Boolean
  }

  type Organisation {
    id: String!
    name: String!
    avatarUrl: String
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

  type PublicMap {
    id: String!
    viewId: String!
    mapId: String!
    host: String!
    name: String!
    description: String!
    descriptionLink: String!
    published: Boolean!
    dataSourceConfigs: [PublicMapDataSourceConfig!]!
  }

  type PublicMapDataSourceConfig {
    allowUserEdit: Boolean!
    allowUserSubmit: Boolean!
    dataSourceId: String!
    dataSourceLabel: String!
    formUrl: String!
    nameColumns: [String!]!
    nameLabel: String!
    descriptionColumn: String!
    descriptionLabel: String!
    additionalColumns: [PublicMapColumn!]!
  }

  type PublicMapColumn {
    label: String!
    sourceColumns: [String!]!
    type: PublicMapColumnType!
  }

  type RecordCount {
    count: Int!
    matched: Int!
  }

  type RecordFilter {
    children: [RecordFilter!]
    column: String
    dataSourceId: String
    dataRecordId: String
    distance: Int
    label: String
    operator: FilterOperator
    placedMarker: String
    search: String
    turf: String
    type: FilterType!
  }

  type Turf {
    id: String!
    label: String!
    notes: String!
    area: Float!
    polygon: JSON!
    createdAt: Date!
  }

  type Sort {
    name: String!
    desc: Boolean!
  }

  type Query {
    areaStats(
      areaSetCode: AreaSetCode!
      dataSourceId: String!
      column: String!
      excludeColumns: [String!]!
      boundingBox: BoundingBoxInput
      calculationType: CalculationType!
    ): AreaStats @auth(read: { dataSourceIdArg: "dataSourceId" })

    dataSource(id: String!): DataSource @auth(read: { dataSourceIdArg: "id" })
    dataSources(organisationId: String, includePublic: Boolean): [DataSource!] @auth

    map(id: String!): Map @auth(read: { mapIdArg: "id" })
    maps(organisationId: String!): [Map!] @auth(read: { organisationIdArg: "organisationId" })
    organisations: [Organisation!] @auth
    publicMap(viewId: String!): PublicMap @auth(write: { viewIdArg: "viewId" })
    publishedPublicMap(host: String!): PublicMap
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

  type UpdateMapConfigResponse {
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

  type UpsertPublicMapResponse {
    code: Int!
    result: PublicMap
  }

  type UpsertTurfResponse {
    code: Int!
    result: Turf
  }

  type Mutation {
    createDataSource(
      name: String!
      organisationId: String!
      recordType: DataSourceRecordType!
      rawConfig: JSON!
    ): CreateDataSourceResponse @auth(read: { organisationIdArg: "organisationId" })
    createMap(organisationId: String!): CreateMapResponse @auth(read: { organisationIdArg: "organisationId" })
    deleteFolder(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
    deletePlacedMarker(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
    deleteTurf(id: String!, mapId: String!): MutationResponse @auth(write: { mapIdArg: "mapId" })
    enqueueEnrichDataSourceJob(dataSourceId: String!): MutationResponse @auth(read: { dataSourceIdArg: "dataSourceId" })
    enqueueImportDataSourceJob(dataSourceId: String!): MutationResponse @auth(read: { dataSourceIdArg: "dataSourceId" })
    saveMapViewsToCRM(id: String!): MutationResponse @auth(write: { mapIdArg: "id" })
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
    updateMapConfig(
      mapId: String!
      mapConfig: MapConfigInput!
      views: [MapViewInput!]!
    ): UpdateMapConfigResponse @auth(write: { mapIdArg: "mapId" })
    upsertFolder(
      id: String!
      name: String!
      notes: String!
      position: Float!
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
    upsertPublicMap(
      viewId: String!
      host: String!
      name: String!
      description: String!
      descriptionLink: String!
      dataSourceConfigs: [PublicMapDataSourceConfigInput!]!
      published: Boolean!
    ): UpsertPublicMapResponse @auth(write: { viewIdArg: "viewId" })
    upsertTurf(
      id: String
      label: String!
      notes: String!
      area: Float!
      polygon: JSON!
      createdAt: Date!
      mapId: String!
    ): UpsertTurfResponse @auth(write: { mapIdArg: "mapId" })

    forgotPassword(email: String!): MutationResponse
    resetPassword(token: String!, password: String!): MutationResponse
  }

  type DataSourceEvent {
    dataSourceId: String!

    enrichmentStarted: JobStatusEvent
    enrichmentComplete: JobStatusEvent
    enrichmentFailed: JobStatusEvent

    importStarted: JobStatusEvent
    importComplete: JobStatusEvent
    importFailed: JobStatusEvent

    recordsEnriched: RecordsProcessedEvent
    recordsImported: RecordsProcessedEvent
  }

  type JobStatusEvent {
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
