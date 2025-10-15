import { createContext } from "react";
import type { DataSource } from "@/server/models/DataSource";
import type { LayerType } from "@/types";

export interface InspectorContent {
  type: LayerType;
  name: string;
  properties: Record<string, unknown> | null;
  dataSource: DataSource | null;

  // Unified identifier system - always present
  id: string; // Unique identifier for this item
  dataSourceId?: string; // Data source ID for records (members/markers)
  mapId?: string; // Map ID for placed markers and turfs

  // Navigation context for hierarchical views
  parent?: {
    type: LayerType;
    name: string;
    id: string; // Parent's unified ID
  };

  // Special data for different layer types
  boundaryFeature?: Record<string, unknown>; // GeoJSON feature for boundaries
  recordId?: string; // For individual records within areas/boundaries (deprecated - use id instead)
}

export const InspectorContext = createContext<{
  inspectorContent: InspectorContent | null;
  resetInspector: () => void;
  setInspectorContent: (content: InspectorContent) => void;
  navigateToParent: () => void;
}>({
  inspectorContent: null,
  resetInspector: () => null,
  setInspectorContent: () => null,
  navigateToParent: () => null,
});
