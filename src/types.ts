// Only import library types and generated types into this file
import type { PublicMapColumnType } from "./server/models/PublicMap";
import type { Point } from "@/server/models/shared";
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

export interface PointFeature {
  type: "Feature";
  properties: Record<string, string | number | boolean>;
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
  options?: string[];
}

export interface RecordData {
  id: string;
  json: Record<string, unknown>;
  geocodePoint: Point;
}

export interface RecordsResponse {
  count: { matched: number };
  records: RecordData[];
}

export enum LayerType {
  Member = "Member",
  Marker = "Marker",
  Turf = "Turf",
  Boundary = "Boundary",
}
