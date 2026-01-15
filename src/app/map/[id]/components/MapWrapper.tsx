import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MapType } from "@/server/models/MapView";
import { useInspector } from "../hooks/useInspector";
import {
  useCompareGeographiesMode,
  useMapControls,
  useShowControls,
} from "../hooks/useMapControls";
import { useMapViews } from "../hooks/useMapViews";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import InspectorPanel from "./inspector/InspectorPanel";
import MapMarkerAndAreaControls from "./MapMarkerAndAreaControls";
import MapStyleSelector from "./MapStyleSelector";
import ZoomControl from "./ZoomControl";
import AreaInfo from "./AreaInfo";
import "./MapWrapper.css"; // overriding styles of mapbox elements

export default function MapWrapper({
  currentMode,
  children,
  hideDrawControls = false,
}: {
  currentMode: string | null;
  children: React.ReactNode;
  hideDrawControls?: boolean;
}) {
  const showControls = useShowControls();
  const { viewConfig } = useMapViews();
  const { inspectorContent } = useInspector();
  const inspectorVisible = Boolean(inspectorContent);
  const compareGeographiesMode = useCompareGeographiesMode();
  const {
    pinDropMode,
    editAreaMode,
    setPinDropMode,
    setEditAreaMode,
    setCompareGeographiesMode,
  } = useMapControls();

  const [message, setMessage] = useState<string>("");
  const [indicatorColor, setIndicatorColor] = useState<string>("");

  const handleCancelMode = () => {
    if (pinDropMode) {
      setPinDropMode(false);
    }
    if (editAreaMode) {
      setEditAreaMode(false);
    }
    if (compareGeographiesMode) {
      setCompareGeographiesMode(false);
    }
  };

  useEffect(() => {
    if (editAreaMode || currentMode === "draw_polygon") {
      setIndicatorColor(mapColors.areas.color);
      setMessage(
        "You are in draw mode. Click to add points. Double click to finish drawing.",
      );
    } else if (pinDropMode || currentMode === "pin_drop") {
      setIndicatorColor(mapColors.markers.color);
      setMessage("Click on the map to drop a pin.");
    } else if (compareGeographiesMode) {
      setIndicatorColor(mapColors.geography.color); // green-500
      setMessage("Compare mode active. Click geographies to select/deselect.");
    } else {
      setIndicatorColor("");
      setMessage("");
    }
  }, [currentMode, compareGeographiesMode, pinDropMode, editAreaMode]);

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

      <AreaInfo />

      {!hideDrawControls && (
        <>
          <InspectorPanel />

          {viewConfig.mapType !== MapType.Hex && (
            <div
              className="absolute bottom-8 left-1/2 z-10 transition-transform duration-300"
              style={absolutelyCenter}
            >
              <MapMarkerAndAreaControls />
            </div>
          )}

          {message && (
            <div
              className="absolute left-1/2 z-10 transition-transform duration-300"
              style={{
                ...absolutelyCenter,
                bottom: viewConfig.mapType !== MapType.Hex ? "90px" : "32px",
              }}
            >
              <div className="flex items-center gap-2 px-3 py-3 rounded shadow-md bg-white">
                {indicatorColor && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: indicatorColor }}
                  />
                )}
                <p className="text-xs">{message}</p>
                <button
                  className="p-1 cursor-pointer hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                  aria-label="Cancel mode"
                  onClick={handleCancelMode}
                >
                  <XIcon size={14} className="text-neutral-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
