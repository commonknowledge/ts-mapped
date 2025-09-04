// Only import library types into this file
import { Geometry } from "geojson";

export interface CurrentUser {
  id: string;
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
  properties: Record<string, string | number>;
  geometry: { coordinates: [number, number]; type: "Point" };
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
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
