import { createContext } from "react";
import type { Folder, PlacedMarker, Turf } from "@/__generated__/types";
import type { PointFeature } from "@/types";
import type { Feature } from "geojson";

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

  selectedPlacedMarkerId: string | null;
  setSelectedPlacedMarkerId: (id: string | null) => void;

  searchMarker: Feature | null;
  setSearchMarker: (marker: Feature | null) => void;

  turfs: Turf[];
  turfsLoading: boolean;
  deleteTurf: (id: string) => void;
  insertTurf: (turf: Turf) => void;
  updateTurf: (turf: Turf) => void;

  /* GraphQL Queries */
  dataSourceMarkers:
    | {
        dataSourceId: string;
        markers: PointFeature[];
        isPending: boolean;
      }[]
    | null;

  /* helpers */
  handleAddArea: () => void;
  handleDropPin: () => void;
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
  selectedPlacedMarkerId: null,
  setSelectedPlacedMarkerId: () => null,
  searchMarker: null,
  setSearchMarker: () => null,
  turfs: [],
  turfsLoading: false,
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  dataSourceMarkers: null,
  handleAddArea: () => null,
  handleDropPin: () => null,
});
