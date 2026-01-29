/**
 * Public API Types for ts-mapped
 *
 * These types can be imported by external projects that consume the ts-mapped REST API.
 *
 * Recommended Installation:
 *   npm install github:commonknowledge/ts-mapped-sdk
 *
 * Usage:
 *   import type { GeoJSONAPIResponse, GeoJSONFeatureProperties } from '@commonknowledge/ts-mapped-sdk';
 *
 * Documentation:
 *   See src/api/README.md for detailed usage examples and API reference.
 */

import type { Feature, FeatureCollection, Point } from "geojson";

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Geographic point with latitude and longitude
 */
export interface APIPoint {
  lat: number;
  lng: number;
}

/**
 * Result of geocoding a data record
 */
export interface APIGeocodeResult {
  /** Map of area type to area code (e.g., { "lad": "E09000001" }) */
  areas: Record<string, string>;
  /** Central point of the geocoded location */
  centralPoint: APIPoint | null;
  /** Sample point for the location */
  samplePoint: APIPoint | null;
}

// ============================================================================
// GEOJSON API TYPES - GET /api/rest/data-sources/:dataSourceId/geojson
// ============================================================================

/**
 * Filter operators for combining filter conditions
 */
export enum APIFilterOperator {
  AND = "AND",
  OR = "OR",
}

/**
 * Types of filters that can be applied
 */
export enum APIFilterType {
  /** Geographic filter (proximity, turf) */
  GEO = "GEO",
  /** Multi-select filter */
  MULTI = "MULTI",
  /** Text search filter */
  TEXT = "TEXT",
}

/**
 * Filter input for querying data records
 */
export interface APIRecordFilter {
  /** Column name to filter on */
  column?: string | null;
  /** Specific data record ID to filter */
  dataRecordId?: string | null;
  /** Data source ID to filter */
  dataSourceId?: string | null;
  /** Distance in meters for geo filters */
  distance?: number | null;
  /** Human-readable label for the filter */
  label?: string | null;
  /** Operator for combining child filters */
  operator?: APIFilterOperator | null;
  /** Placed marker ID for geo filters */
  placedMarker?: string | null;
  /** Search text for text filters */
  search?: string | null;
  /** Turf ID for geo filters */
  turf?: string | null;
  /** Type of filter */
  type: APIFilterType;
  /** Nested child filters */
  children?: APIRecordFilter[] | null;
}

/**
 * Sort configuration for data records
 */
export interface APIRecordSort {
  /** Column name to sort by */
  name: string;
  /** Sort in descending order */
  desc: boolean;
  /** Optional location for distance-based sorting */
  location?: APIPoint | null;
}

/**
 * Query parameters for the GeoJSON API
 */
export interface GeoJSONAPIQueryParams {
  /** JSON string of RecordFilterInput (optional) */
  filter?: string;
  /** Search string (optional) */
  search?: string;
  /** Page number for pagination (optional, default: 0) */
  page?: string;
  /** JSON array of SortInput (optional) */
  sort?: string;
  /** Return all records, not just one page (optional, default: false) */
  all?: string;
}

/**
 * Properties included in each GeoJSON feature from the API
 *
 * The properties object includes all fields from the original data record's JSON,
 * plus these special underscore-prefixed fields added by the API.
 */
export interface GeoJSONFeatureProperties {
  /** ID of the data source this record belongs to */
  _dataSourceId: string;
  /** External ID from the original data source (e.g., Airtable record ID) */
  _externalId: string;
  /** Geocoding result with area information */
  _geocodeResult: APIGeocodeResult | null;
  /** Plus any additional properties from the original record.json */
  [key: string]: unknown;
}

/**
 * A single feature in the GeoJSON response
 */
export type GeoJSONAPIFeature = Feature<Point, GeoJSONFeatureProperties> & {
  /** Data record ID */
  id: string;
};

/**
 * Response from GET /api/rest/data-sources/:dataSourceId/geojson
 *
 * A standard GeoJSON FeatureCollection with Point geometries.
 */
export interface GeoJSONAPIResponse extends FeatureCollection<
  Point,
  GeoJSONFeatureProperties
> {
  type: "FeatureCollection";
  features: GeoJSONAPIFeature[];
}

/**
 * Error response from the GeoJSON API
 */
export interface GeoJSONAPIErrorResponse {
  error: string;
  details?: unknown;
}

// ============================================================================
// RE-EXPORT GEOJSON TYPES FOR CONVENIENCE
// ============================================================================

export type { Feature, FeatureCollection, Point } from "geojson";
