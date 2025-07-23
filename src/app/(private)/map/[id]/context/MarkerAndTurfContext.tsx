import { createContext } from "react";
import { MarkerFolder, PlacedMarker, Turf } from "@/__generated__/types";
import { MarkerData } from "@/types";
import { MarkerQueriesResult } from "../types";

export const MarkerAndTurfContext = createContext<{
  /* State */
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  placedMarkers: PlacedMarker[];
  placedMarkersLoading: boolean;
  deletePlacedMarker: (id: string) => void;
  insertPlacedMarker: (placedMarker: PlacedMarker) => void;
  updatePlacedMarker: (placedMarker: PlacedMarker) => void;
  reorderMarkers: (markerPositions: { id: string; position: number }[]) => void;
  reorderFolders: (folderPositions: { id: string; position: number }[]) => void;

  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;

  turfs: Turf[];
  turfsLoading: boolean;
  deleteTurf: (id: string) => void;
  insertTurf: (turf: Turf) => void;
  updateTurf: (turf: Turf) => void;

  markerFolders: MarkerFolder[];
  markerFoldersLoading: boolean;
  deleteMarkerFolder: (id: string) => void;
  insertMarkerFolder: (markerFolder: MarkerFolder) => void;
  updateMarkerFolder: (markerFolder: MarkerFolder) => void;
  updateFolderMarkerReferences: (oldId: string, newId: string) => void;

  /* GraphQL Queries */
  markerQueries: MarkerQueriesResult | null;
}>({
  editingTurf: null,
  setEditingTurf: () => null,
  placedMarkers: [],
  placedMarkersLoading: false,
  deletePlacedMarker: () => null,
  insertPlacedMarker: () => null,
  updatePlacedMarker: () => null,
  reorderMarkers: () => null,
  reorderFolders: () => null,
  selectedMarker: null,
  setSelectedMarker: () => null,
  turfs: [],
  turfsLoading: false,
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  markerFolders: [],
  markerFoldersLoading: false,
  deleteMarkerFolder: () => null,
  insertMarkerFolder: () => null,
  updateMarkerFolder: () => null,
  updateFolderMarkerReferences: () => null,
  markerQueries: null,
});
