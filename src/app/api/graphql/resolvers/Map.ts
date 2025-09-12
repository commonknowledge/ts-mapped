import { findFoldersByMapId } from "@/server/repositories/Folder";
import { findMapViewsByMapId } from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import { findTurfsByMapId } from "@/server/repositories/Turf";
import type {
  Map,
  MapResolvers as MapResolversType,
} from "@/__generated__/types";

const MapResolvers: MapResolversType = {
  folders: ({ id }: Map) => findFoldersByMapId(id),
  placedMarkers: ({ id }: Map) => findPlacedMarkersByMapId(id),
  turfs: async ({ id }: Map) => findTurfsByMapId(id),
  views: ({ id }: Map) => findMapViewsByMapId(id),
};

export default MapResolvers;
