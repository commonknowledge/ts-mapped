import { createContext } from "react";

export interface InspectorContent {
  type: "member" | "marker" | "turf";
  name: string | unknown;
  properties: Record<string, unknown> | null;
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
