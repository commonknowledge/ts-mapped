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
