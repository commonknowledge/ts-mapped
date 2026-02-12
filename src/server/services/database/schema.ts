/**
 * Database Schema Documentation
 *
 * This file represents the complete database schema as defined by all migrations.
 * It includes all tables, columns, types, constraints, and relationships.
 *
 * Last updated: 2026-02-05
 * Based on migrations up to: 1764611637231_map_view_inspector_config.ts
 */

/**
 * EXTENSIONS
 * - pgcrypto: For gen_random_uuid() function
 * - postgis: For geography type and spatial operations
 * - pg_trgm: For trigram text search operations
 */

// ============================================================================
// AREA MANAGEMENT
// ============================================================================

/**
 * areaSet Table
 * Represents sets of geographic areas (e.g., countries, states, regions)
 */
export interface AreaSet {
  id: number; // bigserial, PRIMARY KEY
  code: string; // text, UNIQUE, NOT NULL
  name: string; // text, UNIQUE, NOT NULL
}

/**
 * area Table
 * Individual geographic areas with spatial data
 */
export interface Area {
  id: number; // bigserial, PRIMARY KEY
  code: string; // text, NOT NULL
  name: string; // text, NOT NULL
  geography: unknown; // geography (PostGIS), NOT NULL
  areaSetId: number; // bigint, NOT NULL
  geom: unknown; // geometry(MultiPolygon,4326), GENERATED ALWAYS AS ((geography)::geometry) STORED, NOT NULL

  // CONSTRAINTS:
  // - UNIQUE (code, areaSetId)
  // FOREIGN KEYS:
  // - areaSetId -> areaSet.id (CASCADE DELETE, CASCADE UPDATE)
  // INDEXES:
  // - area_geography_gist USING GIST (geography)
  // - area_area_set_id_geography_gist USING GIST (area_set_id, geography)
  // - area_area_set_id_geom_gist USING GIST (area_set_id, geom)
}

// ============================================================================
// USER & ORGANIZATION MANAGEMENT
// ============================================================================

/**
 * user Table
 * Application users with authentication
 */
export interface User {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  email: string; // text, UNIQUE, NOT NULL
  passwordHash: string; // text, NOT NULL
  name: string; // text, NOT NULL, DEFAULT ''
  avatarUrl: string | null; // text, NULL
  createdAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL
}

/**
 * organisation Table
 * Organizations that users belong to
 */
export interface Organisation {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  name: string; // text, UNIQUE, NOT NULL
  avatarUrl: string | null; // text, NULL
  createdAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL
}

/**
 * organisationUser Table
 * Junction table for many-to-many relationship between organisations and users
 */
export interface OrganisationUser {
  id: number; // bigserial, NOT NULL
  organisationId: string | null; // uuid, NULL
  userId: string | null; // uuid, NULL

  // CONSTRAINTS:
  // - UNIQUE (organisationId, userId)
  // FOREIGN KEYS:
  // - organisationId -> organisation.id (CASCADE DELETE, CASCADE UPDATE)
  // - userId -> user.id (CASCADE DELETE, CASCADE UPDATE)
}

/**
 * invitation Table
 * User invitations to join organizations
 */
export interface Invitation {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  email: string; // text, NOT NULL
  name: string; // text, NOT NULL
  organisationId: string; // uuid, NOT NULL
  userId: string | null; // uuid, NULL
  used: boolean; // boolean, NOT NULL, DEFAULT false
  createdAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL
  updatedAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // FOREIGN KEYS:
  // - organisationId -> organisation.id (CASCADE DELETE, CASCADE UPDATE)
  // - userId -> user.id (SET NULL DELETE, CASCADE UPDATE)
}

// ============================================================================
// DATA SOURCES & RECORDS
// ============================================================================

/**
 * dataSource Table
 * External data sources that can be imported and mapped
 */
export interface DataSource {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  name: string; // text, NOT NULL
  config: object; // jsonb, UNIQUE, NOT NULL, DEFAULT {}
  geocodingConfig: object; // jsonb, NOT NULL, DEFAULT {}
  columnDefs: unknown[]; // jsonb, NOT NULL, DEFAULT []
  columnRoles: object; // jsonb, NOT NULL, DEFAULT {} (renamed from columnsConfig)
  enrichments: unknown[]; // jsonb, NOT NULL, DEFAULT [] (renamed from enrichmentConfig)
  organisationId: string; // uuid, NOT NULL
  autoImport: boolean; // boolean, NOT NULL, DEFAULT false
  autoEnrich: boolean; // boolean, NOT NULL, DEFAULT false
  public: boolean; // boolean, NOT NULL, DEFAULT false
  recordType: string; // text, NOT NULL, DEFAULT 'Other' (Members, People, Locations, Events, Data, Other)
  dateFormat: string; // text, NOT NULL, DEFAULT 'yyyy-MM-dd'
  recordCount: number; // integer, NOT NULL, DEFAULT 0
  createdAt: Date; // timestamp, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // FOREIGN KEYS:
  // - organisationId -> organisation.id (CASCADE DELETE, CASCADE UPDATE)
}

/**
 * dataRecord Table
 * Individual records from data sources
 */
export interface DataRecord {
  id: number; // bigserial, NOT NULL
  externalId: string; // text, NOT NULL
  json: object; // jsonb, NOT NULL, DEFAULT {}
  geocodeResult: object | null; // jsonb, NULL
  dataSourceId: string; // uuid, NOT NULL
  geocodePoint: unknown | null; // geography, NULL
  jsonTextSearch: string; // text, GENERATED ALWAYS AS (jsonb_values_text(json)) STORED
  needsImport: boolean; // boolean, NOT NULL, DEFAULT false
  needsEnrich: boolean; // boolean, NOT NULL, DEFAULT false
  createdAt: Date; // timestamp, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // CONSTRAINTS:
  // - UNIQUE (externalId, dataSourceId)
  // FOREIGN KEYS:
  // - dataSourceId -> dataSource.id (CASCADE DELETE, CASCADE UPDATE)
  // INDEXES:
  // - dataRecordDataSourceIdIndex ON (dataSourceId)
  // - data_record_geocode_point_gist USING GIST (geocode_point)
  // - dataRecordJsonTextSearchIdx USING GIN (json_text_search gin_trgm_ops)
}

/**
 * CUSTOM FUNCTIONS:
 * - jsonb_values_text(data jsonb): Converts all JSONB values to searchable text
 */

// ============================================================================
// WEBHOOKS & INTEGRATIONS
// ============================================================================

/**
 * airtableWebhook Table
 * Airtable webhook registrations for real-time sync
 */
export interface AirtableWebhook {
  id: string; // varchar(32), PRIMARY KEY
  cursor: number; // integer, NOT NULL
  createdAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL
}

// ============================================================================
// MAPS & VIEWS
// ============================================================================

/**
 * map Table
 * Maps that contain data visualizations and annotations
 */
export interface Map {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  organisationId: string; // uuid, NOT NULL
  name: string; // text, NOT NULL
  imageUrl: string | null; // text, NULL
  config: object; // jsonb, NOT NULL, DEFAULT {}
  createdAt: Date; // timestamp, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // FOREIGN KEYS:
  // - organisationId -> organisation.id (CASCADE DELETE, CASCADE UPDATE)
  // INDEXES:
  // - idx_map_config_member_data_source_id USING GIN ((config->'memberDataSourceId'))
  // - idx_map_config_marker_data_source_ids USING GIN ((config->'markerDataSourceIds'))
}

/**
 * mapView Table
 * Different views/configurations for a map
 */
export interface MapView {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  config: object; // jsonb, NOT NULL
  mapId: string; // uuid, NOT NULL
  name: string; // text, NOT NULL, DEFAULT 'Untitled'
  position: number; // double precision, NOT NULL, DEFAULT 0
  dataSourceViews: unknown[]; // jsonb, NOT NULL, DEFAULT []
  inspectorConfig: unknown[] | null; // jsonb, NULL - Array of InspectorDataSourceConfig
  createdAt: Date; // timestamp, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // FOREIGN KEYS:
  // - mapId -> map.id (CASCADE DELETE, CASCADE UPDATE)
}

/**
 * publicMap Table
 * Public sharing configurations for maps
 */
export interface PublicMap {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  host: string; // text, UNIQUE, NOT NULL
  name: string; // text, NOT NULL
  description: string; // text, NOT NULL, DEFAULT ''
  descriptionLink: string; // text, NOT NULL, DEFAULT ''
  descriptionLong: string | null; // text, NULL
  mapId: string; // uuid, NOT NULL
  viewId: string; // uuid, UNIQUE, NOT NULL
  published: boolean; // boolean, NOT NULL, DEFAULT false
  dataSourceConfigs: unknown[]; // jsonb, NOT NULL, DEFAULT []
  colorScheme: string | null; // text, NULL (renamed from colour_scheme -> color_scheme)
  imageUrl: string | null; // text, NULL
  createdAt: string; // text, DEFAULT CURRENT_TIMESTAMP, NOT NULL

  // FOREIGN KEYS:
  // - mapId -> map.id (CASCADE DELETE, CASCADE UPDATE)
  // - viewId -> mapView.id (CASCADE DELETE, CASCADE UPDATE)
}

// ============================================================================
// MAP ANNOTATIONS
// ============================================================================

/**
 * folder Table
 * Folders for organizing placed markers
 */
export interface Folder {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  mapId: string; // uuid, NOT NULL
  name: string; // text, NOT NULL
  notes: string; // text, NOT NULL, DEFAULT ''
  position: number; // double precision, NOT NULL, DEFAULT 0
  hideMarkers: boolean | null; // boolean, NULL

  // FOREIGN KEYS:
  // - mapId -> map.id (CASCADE DELETE, CASCADE UPDATE)
}

/**
 * placedMarker Table
 * User-placed markers on maps
 */
export interface PlacedMarker {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  mapId: string; // uuid, NOT NULL
  label: string; // text, NOT NULL
  notes: string; // text, NOT NULL, DEFAULT ''
  point: unknown; // geography, NOT NULL
  folderId: string | null; // uuid, NULL
  position: number; // double precision, NOT NULL, DEFAULT 0

  // FOREIGN KEYS:
  // - mapId -> map.id (CASCADE DELETE, CASCADE UPDATE)
  // - folderId -> folder.id (RESTRICT DELETE, CASCADE UPDATE)
  // INDEXES:
  // - placed_marker_point_gist USING GIST (point)
}

/**
 * turf Table
 * Polygon areas drawn on maps (turfs)
 */
export interface Turf {
  id: string; // uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
  label: string; // text, NOT NULL
  notes: string; // text, NOT NULL, DEFAULT ''
  area: number; // double precision, NOT NULL
  polygon: unknown; // geography, NOT NULL
  createdAt: Date; // timestamp, DEFAULT CURRENT_TIMESTAMP, NOT NULL
  mapId: string; // uuid, NOT NULL

  // FOREIGN KEYS:
  // - mapId -> map.id (CASCADE DELETE, CASCADE UPDATE)
  // INDEXES:
  // - turf_polygon_gist USING GIST (polygon)
}

// ============================================================================
// DATABASE RELATIONSHIPS SUMMARY
// ============================================================================

/**
 * RELATIONSHIP DIAGRAM:
 *
 * organisation
 *   ├─> organisationUser ─> user
 *   ├─> dataSource
 *   │     └─> dataRecord
 *   ├─> map
 *   │     ├─> mapView ─> publicMap
 *   │     ├─> folder
 *   │     │     └─> placedMarker
 *   │     └─> turf
 *   └─> invitation ─> user
 *
 * areaSet
 *   └─> area
 *
 * airtableWebhook (standalone)
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface Database {
  // Area Management
  areaSet: AreaSet;
  area: Area;

  // User & Organization
  user: User;
  organisation: Organisation;
  organisationUser: OrganisationUser;
  invitation: Invitation;

  // Data Sources & Records
  dataSource: DataSource;
  dataRecord: DataRecord;

  // Webhooks & Integrations
  airtableWebhook: AirtableWebhook;

  // Maps & Views
  map: Map;
  mapView: MapView;
  publicMap: PublicMap;

  // Map Annotations
  folder: Folder;
  placedMarker: PlacedMarker;
  turf: Turf;
}
