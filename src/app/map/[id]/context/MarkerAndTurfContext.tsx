import { createContext } from "react";
import type { Turf } from "@/server/models/Turf";
import type { LayerType } from "@/types";
import type { Feature } from "geojson";

export const MarkerAndTurfContext = createContext<{
  /* State */
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  selectedPlacedMarkerId: string | null;
  setSelectedPlacedMarkerId: (id: string | null) => void;

  searchMarker: Feature | null;
  setSearchMarker: (marker: Feature | null) => void;

  visibleTurfs: Turf[];
  /* helpers */
  handleAddArea: () => void;
  handleDropPin: () => void;

  /* Individual visibility management */
  markerVisibility: Record<string, boolean>;
  turfVisibility: Record<string, boolean>;
  dataSourceVisibility: Record<string, boolean>;
  setMarkerVisibilityState: (markerId: string, isVisible: boolean) => void;
  setTurfVisibilityState: (turfId: string, isVisible: boolean) => void;
  setDataSourceVisibilityState: (
    dataSourceId: string,
    isVisible: boolean,
  ) => void;
  getMarkerVisibility: (markerId: string) => boolean;
  getTurfVisibility: (turfId: string) => boolean;
  getDataSourceVisibility: (dataSourceId: string) => boolean;
  hiddenLayers: LayerType[];
  hideLayer: (layer: LayerType) => void;
  showLayer: (layer: LayerType) => void;
  getLayerVisibility: (layer: LayerType) => boolean;
}>({
  editingTurf: null,
  setEditingTurf: () => null,
  selectedPlacedMarkerId: null,
  setSelectedPlacedMarkerId: () => null,
  searchMarker: null,
  setSearchMarker: () => null,
  visibleTurfs: [],
  handleAddArea: () => null,
  handleDropPin: () => null,

  markerVisibility: {},
  turfVisibility: {},
  dataSourceVisibility: {},
  setMarkerVisibilityState: () => null,
  setTurfVisibilityState: () => null,
  setDataSourceVisibilityState: () => null,
  getMarkerVisibility: () => true,
  getTurfVisibility: () => true,
  getDataSourceVisibility: () => true,
  hiddenLayers: [],
  showLayer: () => null,
  hideLayer: () => null,
  getLayerVisibility: () => true,
});
