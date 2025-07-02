import { Map, MapResolvers as MapResolversType } from "@/__generated__/types";
import { findMapViewsByMapId } from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";

const MapResolvers: MapResolversType = {
  placedMarkers: ({ id }: Map) => findPlacedMarkersByMapId(id),
  views: ({ id }: Map) => findMapViewsByMapId(id),
};

export default MapResolvers;
