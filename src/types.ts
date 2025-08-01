// Only import library types into this file
import { Geometry } from "geojson";

export interface CurrentUser {
  id: string;
}

export enum DataSourceType {
  actionnetwork = "actionnetwork",
  airtable = "airtable",
  csv = "csv",
  googlesheets = "googlesheets",
  mailchimp = "mailchimp",
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

export interface GeocodeResult {
  areas: Record<string, string>;
  centralPoint: Point | null;
  samplePoint: Point | null;
}

export interface MarkerData {
  properties: Record<string, unknown>;
  coordinates: number[];
}

// Property names taken from Mapbox standard
export interface Point {
  lng: number;
  lat: number;
}

export interface PointFeature {
  type: "Feature";
  properties: Record<string, string>;
  geometry: { coordinates: [number, number]; type: "Point" };
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}

export interface UploadResponseBody {
  url: string;
}
