import { createContext } from "react";
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
  areaCode: string;
  areaSetCode: AreaSetCode;
  sourceLayerId: string;
  name: string;
  properties?: Record<string, unknown> | null;
}

export const InspectorContext = createContext<{
  inspectorContent: InspectorContent | null;
  resetInspector: () => void;
  setInspectorContent: (r: InspectorContent) => void;
  selectedRecords: SelectedRecord[];
  setSelectedRecords: (r: SelectedRecord[]) => void;
  selectedRecordIndex: number;
  setSelectedRecordIndex: (i: number) => void;
  // Change selectedRecord by setting the correct index.
  // Not directly settable to prevent getting out-of-sync
  // with selectedRecords.
  selectedRecord: SelectedRecord | null;
  selectedBoundary: SelectedBoundary | null;
  setSelectedBoundary: (r: SelectedBoundary | null) => void;
  selectedTurf: SelectedTurf | null;
  setSelectedTurf: (r: SelectedTurf | null) => void;
}>({
  inspectorContent: null,
  resetInspector: () => null,
  setInspectorContent: () => null,
  selectedRecords: [],
  setSelectedRecords: () => null,
  selectedRecordIndex: 0,
  setSelectedRecordIndex: () => null,
  selectedRecord: null,
  selectedTurf: null,
  setSelectedTurf: () => null,
  selectedBoundary: null,
  setSelectedBoundary: () => null,
});
