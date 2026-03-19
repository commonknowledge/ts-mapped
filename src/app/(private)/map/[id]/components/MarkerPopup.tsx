import { Popup } from "react-map-gl/mapbox";
import { useHoverMarker } from "../hooks/useMapHover";

export default function MarkerPopup() {
  const [hoverMarker] = useHoverMarker();

  if (!hoverMarker) {
    return null;
  }

  return <WrappedMarkerPopup {...hoverMarker} />;
}

function WrappedMarkerPopup({
  coordinates,
  properties,
}: {
  coordinates: [number, number];
  properties: Record<string, unknown>;
}) {
  return (
    <Popup
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      closeButton={false}
    >
      <p className="font-sans font-semibold text-sm">
        {String(properties.name)}
      </p>
    </Popup>
  );
}
