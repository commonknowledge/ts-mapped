import { createContext } from "react";
import type { Turf } from "@/server/models/Turf";
import type { PointFeature } from "@/types";
import type { Feature } from "geojson";

export const MarkerAndTurfContext = createContext<{
  /* State */
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  selectedPlacedMarkerId: string | null;
  setSelectedPlacedMarkerId: (id: string | null) => void;

  searchMarker: Feature | null;
  setSearchMarker: (marker: Feature | null) => void;

  markerQueries: {
    data: { dataSourceId: string; markers: PointFeature[] }[];
    isFetching: boolean;
  } | null;

  /* helpers */
  handleAddArea: () => void;
  handleDropPin: () => void;
}>({
  editingTurf: null,
  setEditingTurf: () => null,
  selectedPlacedMarkerId: null,
  setSelectedPlacedMarkerId: () => null,
  searchMarker: null,
  setSearchMarker: () => null,
  markerQueries: null,
  handleAddArea: () => null,
  handleDropPin: () => null,
});
