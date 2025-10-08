import { createContext } from "react";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = RouterOutputs["dataSource"]["listReadable"][number];

export interface InspectorContent {
  type: "member" | "marker" | "turf";
  name: string | unknown;
  properties: Record<string, unknown> | null;
  dataSource: DataSource | null;
}

export interface SelectedRecord {
  id: string;
  dataSourceId: string;
  properties?: Record<string, unknown> | null;
}

export const InspectorContext = createContext<{
  inspectorContent: InspectorContent | null;
  setInspectorContent: (r: InspectorContent) => void;
  selectedRecord: SelectedRecord | null;
  setSelectedRecord: (r: SelectedRecord | null) => void;
  resetInspector: () => void;
}>({
  inspectorContent: null,
  setInspectorContent: () => null,
  selectedRecord: null,
  setSelectedRecord: () => null,
  resetInspector: () => null,
});
