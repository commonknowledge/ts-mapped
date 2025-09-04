// Only import library types and generated types into this file
import { Geometry } from "geojson";
import { PublicMapColumnType } from "./__generated__/types";

export enum DataSourceType {
  actionnetwork = "actionnetwork",
  airtable = "airtable",
  csv = "csv",
  googlesheets = "googlesheets",
  mailchimp = "mailchimp",
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

export interface GeocodeResult {
  areas: Record<string, string>;
  centralPoint: Point | null;
  samplePoint: Point | null;
}

// Property names taken from Mapbox standard
export interface Point {
  lng: number;
  lat: number;
}

export interface PointFeature {
  type: "Feature";
  properties: Record<string, string | number>;
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
