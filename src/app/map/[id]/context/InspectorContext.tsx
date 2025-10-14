import { createContext } from "react";
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
  properties?: Record<string, unknown> | null;
}

export interface SelectedTurf {
  id: string;
  name: string;
  geometry: Polygon;
}

export const InspectorContext = createContext<{
  inspectorContent: InspectorContent | null;
  resetInspector: () => void;
  setInspectorContent: (r: InspectorContent) => void;
  selectedRecord: SelectedRecord | null;
  setSelectedRecord: (r: SelectedRecord | null) => void;

  selectedTurf: SelectedTurf | null;
  setSelectedTurf: (r: SelectedTurf | null) => void;
}>({
  inspectorContent: null,
  resetInspector: () => null,
  setInspectorContent: () => null,
  selectedRecord: null,
  setSelectedRecord: () => null,
  selectedTurf: null,
  setSelectedTurf: () => null,
});
