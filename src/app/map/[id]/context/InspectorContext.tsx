import { createContext } from "react";
import type { Point } from "@/server/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";
import type { LayerType } from "@/types";
import type { Polygon } from "geojson";

type DataSource = RouterOutputs["dataSource"]["listReadable"][number];

export interface InspectorContent {
  type: LayerType | undefined;
  name: string | unknown;
  properties: Record<string, unknown> | null;
  dataSource: DataSource | null;
}

export interface SelectedRecord {
  id: string;
  dataSourceId: string;
  point?: Point | null;
  properties?: Record<string, unknown> | null;
}

export interface SelectedTurf {
  id: string;
  name: string;
  geometry: Polygon;
}

export interface SelectedBoundary {
  id: string;
  name: string;
  properties: Record<string, unknown>;
}

export const InspectorContext = createContext<{
  inspectorContent: InspectorContent | null;
  resetInspector: () => void;
  setInspectorContent: (r: InspectorContent) => void;
  selectedRecord: SelectedRecord | null;
  setSelectedRecord: (r: SelectedRecord | null) => void;

  selectedTurf: SelectedTurf | null;
  setSelectedTurf: (r: SelectedTurf | null) => void;

  selectedBoundary: SelectedBoundary | null;
  setSelectedBoundary: (r: SelectedBoundary | null) => void;
}>({
  inspectorContent: null,
  resetInspector: () => null,
  setInspectorContent: () => null,
  selectedRecord: null,
  setSelectedRecord: () => null,
  selectedTurf: null,
  setSelectedTurf: () => null,
  selectedBoundary: null,
  setSelectedBoundary: () => null,
});
