import { Map, MapResolvers as MapResolversType } from "@/__generated__/types";
import { serializeTurf } from "@/app/api/graphql/serializers";
import { findMapViewsByMapId } from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import { findTurfsByMapId } from "@/server/repositories/Turf";

const MapResolvers: MapResolversType = {
  placedMarkers: ({ id }: Map) => findPlacedMarkersByMapId(id),
  turfs: async ({ id }: Map) => {
    const turfs = await findTurfsByMapId(id);
    return turfs.map(serializeTurf);
  },
  views: ({ id }: Map) => findMapViewsByMapId(id),
};

export default MapResolvers;
