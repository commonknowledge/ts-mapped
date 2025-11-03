import { useContext, useEffect, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import InspectorPanel from "./inspector/InspectorPanel";
import MapMarkerAndAreaControls from "./MapMarkerAndAreaControls";
import MapStyleSelector from "./MapStyleSelector";
import ZoomControl from "./ZoomControl";

// overriding styles of mapbox elements
import "./MapWrapper.css";

export default function MapWrapper({
  currentMode,
  children,
  hideDrawControls = false,
}: {
  currentMode: string | null;
  children: React.ReactNode;
  hideDrawControls?: boolean;
}) {
  const { showControls } = useContext(MapContext);

  const [message, setMessage] = useState<string>("");
  const [indicatorColor, setIndicatorColor] = useState<string>("");

  useEffect(() => {
    if (currentMode === "draw_polygon") {
      setIndicatorColor(mapColors.areas.color);
      setMessage(
        "You are in draw mode. Click to add points. Double click to finish drawing."
      );
    } else if (currentMode === "pin_drop") {
      setIndicatorColor(mapColors.markers.color);
      setMessage("Click on the map to drop a pin.");
    } else {
      setIndicatorColor("");
      setMessage("");
    }
  }, [currentMode]);

  const absolutelyCenter = {
    transform: showControls
      ? `translate(calc(-50% + ${CONTROL_PANEL_WIDTH / 2}px))`
      : "translate(-50%)",
  };

  const positionLeft = {
    transform: showControls
      ? `translateX(calc(${CONTROL_PANEL_WIDTH}px))`
      : "translateX(0)",
  };

  return (
    <div className="map-wrapper / absolute top-0 right-0 h-full w-full">
      {children}

      <div
        className="absolute bottom-8 left-8 z-10 transition-transform duration-300 hidden md:block"
        style={positionLeft}
      >
        <MapStyleSelector />
      </div>

      <div className="map-zoom-controls / absolute bottom-8 right-8 z-10 transition-transform duration-300 hidden md:block">
        <ZoomControl />
      </div>

      {!hideDrawControls && (
        <>
          <InspectorPanel />

          <div
            className="absolute bottom-8 left-1/2 z-10 transition-transform duration-300"
            style={absolutelyCenter}
          >
            <MapMarkerAndAreaControls />
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
        </>
      )}
    </div>
  );
}
