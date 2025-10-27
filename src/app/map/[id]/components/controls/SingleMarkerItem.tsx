import { useContext } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import LayerItemWrapper from "./LayerItemWrapper";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function SingleMarkerItem({
  disableClick = false,
  marker,
}: {
  marker: PlacedMarker;
  disableClick?: boolean;
}) {
  const { mapRef } = useContext(MapContext);
  const {
    setSelectedPlacedMarkerId,
    getMarkerVisibility,
    setMarkerVisibilityState,
  } = useContext(MarkerAndTurfContext);

  const isVisible = getMarkerVisibility(marker.id);

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (disableClick || !map) {
      return;
    }

    setSelectedPlacedMarkerId(marker.id);
    map.flyTo({
      center: marker.point,
      zoom: 12,
    });
  };

  return (
    <LayerItemWrapper
      name={marker?.label}
      isVisible={isVisible}
      onVisibilityToggle={() => setMarkerVisibilityState(marker.id, !isVisible)}
    >
      <button
        className="w-full truncate hover:bg-neutral-100 cursor-pointer"
        onClick={() => flyToMarker()}
      >
        {marker.label}
      </button>
    </LayerItemWrapper>
  );
}
