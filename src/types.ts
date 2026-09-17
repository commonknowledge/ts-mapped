// Only import library types and generated types into this file
import type { PublicMapColumnType } from "@/models/PublicMap";
import type { Geometry } from "geojson";

export interface AreaStat {
  areaCode: string;
  value: string | number;
}

export interface BoundingBox {
  east: number;
  north: number;
  south: number;
  west: number;
}

export interface DrawModeChangeEvent {
  mode: string;
}

export interface DrawDeleteEvent {
  features: {
    id: string;
    type: string;
    geometry: Geometry;
    properties: Record<string, unknown>;
  }[];
}

export interface ExternalRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export interface MarkerFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    dataSourceId: string;
    matched: boolean;
    // Formatted record date, only set on public maps that sort by date or
    // hide past events.
    date?: string;
    // Raw event date column value (null when empty), only set on public maps
    // that sort by date or hide past events. Parsed on the client so the
    // past-events cutoff uses the visitor's timezone.
    dateValue?: string | null;
    // Record month key (year * 12 + zero-based month), only set when the
    // data source has a dateColumn role.
    month?: number | null;
  };
  geometry: { coordinates: [number, number]; type: "Point" };
}

// Used in the markers/route.ts GeoJSON response
// As dataSourceId is known in the request parameters
// so doesn't need to be included in the response body
export interface MarkerFeatureWithoutDataSourceId {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    matched: boolean;
    // Formatted record date, only set on public maps that sort by date or
    // hide past events.
    date?: string;
    // Raw event date column value (null when empty), only set on public maps
    // that sort by date or hide past events. Parsed on the client so the
    // past-events cutoff uses the visitor's timezone.
    dateValue?: string | null;
    // Record month key (year * 12 + zero-based month), only set when the
    // data source has a dateColumn role.
    month?: number | null;
  };
  geometry: { coordinates: [number, number]; type: "Point" };
}

export interface TaggedRecord {
  externalId: string;
  json: Record<string, unknown>;
  tag: {
    name: string;
    present: boolean;
  };
}

export interface UploadResponseBody {
  url: string;
}

export interface PublicFiltersFormValue {
  name: string;
  type: PublicMapColumnType;
  value?: string;
  selectedOptions?: string[];
}

export interface FilterField {
  name: string;
  type: PublicMapColumnType;
  label?: string | undefined;
  options?: string[];
}

export enum LayerType {
  Boundary = "Boundary",
  Cluster = "Cluster",
  Member = "Member",
  Marker = "Marker",
  Turf = "Turf",
}

export enum DataRecordMatchType {
  Approximate = "Approximate",
  Contains = "Contains",
  ContainedBy = "ContainedBy",
  Exact = "Exact",
  None = "None",
}
