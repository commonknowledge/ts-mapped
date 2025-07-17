import { createContext } from "react";
import { PlacedMarker, Turf } from "@/__generated__/types";
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

  selectedMarker: MarkerData | null;
  setSelectedMarker: (marker: MarkerData | null) => void;

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
  placedMarkers: [],
  placedMarkersLoading: false,
  deletePlacedMarker: () => null,
  insertPlacedMarker: () => null,
  updatePlacedMarker: () => null,
  selectedMarker: null,
  setSelectedMarker: () => null,
  turfs: [],
  turfsLoading: false,
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  markerQueries: null,
});
