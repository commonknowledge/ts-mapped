import { PointFeature } from "@/types";

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
