import { createContext } from "react";
import { Folder, PlacedMarker, Turf } from "@/__generated__/types";
import { MarkerQueriesResult } from "../types";

export const MarkerAndTurfContext = createContext<{
  /* State */
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  folders: Folder[];
  foldersLoading: boolean;
  deleteFolder: (id: string) => void;
  insertFolder: (folder: Omit<Folder, "position">) => void;
  updateFolder: (folder: Folder) => void;

  placedMarkers: PlacedMarker[];
  placedMarkersLoading: boolean;
  deletePlacedMarker: (id: string) => void;
  insertPlacedMarker: (placedMarker: Omit<PlacedMarker, "position">) => void;
  preparePlacedMarkerUpdate: (placedMarker: PlacedMarker) => void;
  commitPlacedMarkerUpdates: () => void;
  updatePlacedMarker: (placedMarker: PlacedMarker) => void;

  turfs: Turf[];
  turfsLoading: boolean;
  deleteTurf: (id: string) => void;
  insertTurf: (turf: Turf) => void;
  updateTurf: (turf: Turf) => void;

  /* GraphQL Queries */
  markerQueries: MarkerQueriesResult | null;
}>({
  editingTurf: null,
  setEditingTurf: () => null,
  folders: [],
  foldersLoading: false,
  deleteFolder: () => null,
  insertFolder: () => null,
  updateFolder: () => null,
  placedMarkers: [],
  placedMarkersLoading: false,
  deletePlacedMarker: () => null,
  insertPlacedMarker: () => null,
  preparePlacedMarkerUpdate: () => null,
  commitPlacedMarkerUpdates: () => null,
  updatePlacedMarker: () => null,
  turfs: [],
  turfsLoading: false,
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  markerQueries: null,
});
