import { useContext } from "react";
import { MapContext } from "../context/MapContext";
import { mapColours } from "../styles";

export default function AddingLayers() {
  const { addingLayer } = useContext(MapContext);

  if (!addingLayer) {
    return null;
  }

  const addingLayerColor =
    addingLayer === "area" ? mapColours.areas.color : mapColours.markers.color;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
      style={{
        borderColor: addingLayerColor,
        borderWidth: "4px",
      }}
    >
      <div
        className="absolute top-0 left-4 px-3 py-2 rounded-b-lg shadow-lg pointer-events-auto"
        style={{
          backgroundColor: addingLayerColor,
        }}
      >
        <p className="text-sm font-medium">
          {addingLayer === "area"
            ? "Click to add points to your area"
            : "Click to place marker"}
        </p>
        <p className="text-xs uppercase font-mono opacity-50">
          Hit Enter to finish
        </p>
        <p className="text-xs uppercase font-mono opacity-50">
          Hit Esc to cancel
        </p>
      </div>
    </div>
  );
}
