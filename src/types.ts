// Only import library types into this file
import { Geometry } from "geojson";

export interface CurrentUser {
  id: string;
}

export enum DataSourceType {
  airtable = "airtable",
  csv = "csv",
  mailchimp = "mailchimp",
}

export const EditableDataSourceTypes = [
  DataSourceType.airtable,
  DataSourceType.mailchimp,
];

export interface ExternalRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export interface GeocodeResult {
  areas: Record<string, string>;
  centralPoint: Point | null;
  samplePoint: Point | null;
}

export interface MarkerData {
  id: number;
  properties: Record<string, unknown>;
  coordinates: number[];
}

export interface PointFeature {
  type: "Feature";
  properties: Record<string, string>;
  geometry: { coordinates: [number, number]; type: "Point" };
}

// Property names taken from Mapbox standard
export interface Point {
  lng: number;
  lat: number;
}

export interface SearchResult {
  text: string;
  coordinates: [number, number];
  timestamp: Date;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}

export interface UploadResponseBody {
  filename: string;
}

export interface SearchResult {
  text: string;
  coordinates: [number, number];
  timestamp: Date;
}

export interface DrawnPolygon {
  id: string;
  area: number;
  geometry: Geometry;
  timestamp: Date;
  name: string;
}

export interface DrawDeleteEvent {
  features: {
    id: string;
    type: string;
    geometry: Geometry;
    properties: Record<string, unknown>;
  }[];
}
