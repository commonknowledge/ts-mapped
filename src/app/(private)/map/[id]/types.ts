import { PointFeature } from "@/types";

export interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export interface MarkersQueryResult {
  loading: boolean;
  data: {
    dataSource: {
      id: string;
      name: string;
      markers: {
        type: "FeatureCollection";
        features: PointFeature[];
      };
    };
  } | null;
  error: string;
}
