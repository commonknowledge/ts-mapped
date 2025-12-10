import type { AreaSetCode } from "@/server/models/AreaSet";
import type { Point } from "@/server/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";
import type { LayerType } from "@/types";
import type { Polygon } from "geojson";

type DataSource = RouterOutputs["dataSource"]["listReadable"][number];

export interface InspectorContent {
  type: LayerType | undefined;
  name: string | unknown;
  properties: Record<string, unknown> | null;
  dataSource?: DataSource | null;
}

export interface SelectedRecord {
  id: string;
  dataSourceId?: string; // Not present for PlacedMarkers
  name: string;
  geocodePoint: Point | null;
}

export interface SelectedTurf {
  id: string;
  name: string;
  geometry: Polygon;
}

export interface SelectedBoundary {
  id: string;
  areaCode: string;
  areaSetCode: AreaSetCode;
  sourceLayerId: string;
  name: string;
  properties?: Record<string, unknown> | null;
}
