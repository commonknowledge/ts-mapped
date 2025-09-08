// Only import library types and generated types into this file
import { Geometry } from "geojson";
import { PublicMapColumnType } from "./__generated__/types";

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
