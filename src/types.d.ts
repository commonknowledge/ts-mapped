export interface BoundingBox {
  north: number;
  east: number;
  south: number;
  west: number;
}

export interface CurrentUser {
  id: string;
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

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}

export interface SearchResult {
  text: string;
  coordinates: [number, number];
  timestamp: Date;
}

export interface DrawnPolygon {
  id: string;
  area: number;
  geometry: any; // or use proper GeoJSON type
  timestamp: Date;
  name: string;
}

export interface DrawDeleteEvent {
  features: Array<{
    id: string;
    type: string;
    geometry: any;
    properties: any;
  }>;
}
