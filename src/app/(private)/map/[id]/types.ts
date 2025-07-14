import { PointFeature } from "@/types";

export interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export interface DataSourceMarkers {
  id: string;
  name: string;
  markers: { type: "FeatureCollection"; features: PointFeature[] };
}

export interface MarkerQueriesResult {
  loading: boolean;
  data: DataSourceMarkers[] | null;
  error: string;
}
