import { useContext, useEffect, useState } from "react";
import { MapContext } from "../context/MapContext";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import MapStyleSelector from "./MapStyleSelector";

export default function MapWrapper({
  currentMode,
  children,
  ready,
}: {
  currentMode: string | null;
  children: React.ReactNode;
  ready: boolean;
}) {
  const { mapRef, showControls } = useContext(MapContext);

  const [message, setMessage] = useState<string>("");
  const [indicatorColor, setIndicatorColor] = useState<string>("");

  useEffect(() => {
    if (currentMode === "draw_polygon") {
      setIndicatorColor(mapColors.areas.color);
      setMessage(
        "You are in draw mode. Click to add points. Double click to finish drawing.",
      );
    } else if (currentMode === "pin_drop") {
      setIndicatorColor(mapColors.markers.color);
      setMessage("Click on the map to drop a pin.");
    } else {
      setIndicatorColor("");
      setMessage("");
    }
  }, [currentMode]);

  useEffect(() => {
    const map = mapRef?.current;

    console.log('show controls', showControls, Boolean(map), ready)
    if (map && ready) {
      const padding = { left: showControls ? CONTROL_PANEL_WIDTH : 0 }
      console.log('ease to', padding)
      map.easeTo({
        padding,
        duration: 300,
        easing: (t) => t * (2 - t),
      });
    }
  }, [showControls, mapRef, ready]);

  const absolutelyCenter = {
    transform: showControls
      ? `translate(calc(-50% + ${CONTROL_PANEL_WIDTH / 2}px))`
      : "translate(-50%)",
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full">
      {children}

      <div
        className="absolute bottom-8 left-1/2 z-10 transition-transform duration-300"
        style={absolutelyCenter}
      >
        <MapStyleSelector />
      </div>

      {indicatorColor && (
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: indicatorColor }}
        />
      )}

      {message && (
        <div
          className="absolute top-4 left-1/2 z-10 transition-transform duration-300"
          style={absolutelyCenter}
        >
          <p className="px-3 py-2 rounded shadow-md bg-white text-xs">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
