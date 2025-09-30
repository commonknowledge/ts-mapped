import type { RouterOutputs } from "@/services/trpc/react";
import type { PointFeature } from "@/types";

export interface DataSourceMarkers {
  dataSourceId: string;
  dataSourceName: string;
  markers: { type: "FeatureCollection"; features: PointFeature[] };
}

export interface MarkerQueriesResult {
  loading: boolean;
  data: DataSourceMarkers[] | null;
  error: string;
}

export type View = RouterOutputs["map"]["get"]["views"][number];
