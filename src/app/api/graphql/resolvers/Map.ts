import { Map, MapResolvers as MapResolversType } from "@/__generated__/types";
import { findMapViewsByMapId } from "@/server/repositories/MapView";
import { findMarkerFoldersByMapId } from "@/server/repositories/MarkerFolder";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import { findTurfsByMapId } from "@/server/repositories/Turf";

const MapResolvers: MapResolversType = {
  placedMarkers: ({ id }: Map) => findPlacedMarkersByMapId(id),
  markerFolders: async ({ id }: Map) => {
    const folders = await findMarkerFoldersByMapId(id);
    // Parse markerIds from JSON string to array
    return folders.map((folder) => ({
      ...folder,
      markerIds:
        typeof folder.markerIds === "string"
          ? JSON.parse(folder.markerIds)
          : Array.isArray(folder.markerIds)
            ? folder.markerIds
            : [],
    }));
  },
  turfs: async ({ id }: Map) => findTurfsByMapId(id),
  views: ({ id }: Map) => findMapViewsByMapId(id),
};

export default MapResolvers;
