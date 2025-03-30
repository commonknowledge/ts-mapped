// Don't import anything into this file

export enum AreaSetCode {
  OA21 = "OA21",
  PC = "PC",
  MSOA21 = "MSOA21",
  WMC24 = "WMC24",
}

export interface BoundingBox {
  north: number;
  east: number;
  south: number;
  west: number;
}

export interface CurrentUser {
  id: string;
}

export enum DataSourceType {
  airtable = "airtable",
  csv = "csv",
  mailchimp = "mailchimp",
}

export interface GeocodeResult {
  areas: Record<string, string>;
  centralPoint: Point | null;
  samplePoint: Point | null;
}

export enum GeocodingType {
  address = "address",
  code = "code",
  name = "name",
  none = "none",
}

export interface MarkerData {
  id: number;
  properties: Record<string, unknown>;
  coordinates: number[];
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
