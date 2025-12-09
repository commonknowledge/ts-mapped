import { useContext } from "react";
import { Popup } from "react-map-gl/mapbox";
import { HoverAreaContext } from "../context/HoverAreaContext";

export default function AreaPopup() {
  const { hoverAreaCode } = useContext(HoverAreaContext);
  if (!hoverAreaCode) {
    return null;
  }
  return (
    <Popup
      longitude={hoverAreaCode.coordinates[0]}
      latitude={hoverAreaCode.coordinates[1]}
      closeButton={false}
    >
      <p className="font-sans font-semibold text-sm">
        {String(hoverAreaCode.code)}
      </p>
    </Popup>
  );
}
