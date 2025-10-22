import { createContext } from "react";
import type { Folder } from "@/server/models/Folder";
import type { Turf } from "@/server/models/Turf";
import type { PointFeature } from "@/types";
import type { Feature } from "geojson";

export const MarkerAndTurfContext = createContext<{
  /* State */
  editingTurf: Turf | null;
  setEditingTurf: (turf: Turf | null) => void;

  folders: Folder[];
  foldersLoading: boolean;
  deleteFolder: (id: string) => void;
  insertFolder: (folder: Omit<Folder, "position" | "mapId">) => void;
  updateFolder: (folder: Omit<Folder, "mapId">) => void;

  selectedPlacedMarkerId: string | null;
  setSelectedPlacedMarkerId: (id: string | null) => void;

  searchMarker: Feature | null;
  setSearchMarker: (marker: Feature | null) => void;

  turfs: Turf[];
  deleteTurf: (id: string) => void;
  insertTurf: (turf: Omit<Turf, "mapId" | "id" | "createdAt">) => void;
  updateTurf: (turf: Omit<Turf, "mapId">) => void;

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
  folders: [],
  foldersLoading: false,
  deleteFolder: () => null,
  insertFolder: () => null,
  updateFolder: () => null,
  selectedPlacedMarkerId: null,
  setSelectedPlacedMarkerId: () => null,
  searchMarker: null,
  setSearchMarker: () => null,
  turfs: [],
  deleteTurf: () => null,
  insertTurf: () => null,
  updateTurf: () => null,
  markerQueries: null,
  handleAddArea: () => null,
  handleDropPin: () => null,
});
