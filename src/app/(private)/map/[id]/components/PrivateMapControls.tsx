import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MapType } from "@/models/MapView";
import { useChoropleth } from "../hooks/useChoropleth";
import {
  useCompareGeographiesMode,
  useMapControls,
  useShowControls,
} from "../hooks/useMapControls";
import { useDrawMode } from "../hooks/useMapCore";
import { useMapViews } from "../hooks/useMapViews";
import {
  CONTROL_PANEL_WIDTH,
  VISUALISATION_PANEL_WIDTH,
  mapColors,
} from "../styles";
import BoundaryHoverInfo from "./BoundaryHoverInfo/BoundaryHoverInfo";
import InspectorPanel from "./InspectorPanel/InspectorPanel";
import MapMarkerAndAreaControls from "./MapMarkerAndAreaControls";
import MapStyleSelector from "./MapStyleSelector";
import ZoomControl from "./ZoomControl";

export default function PrivateMapControls() {
  const drawMode = useDrawMode();
  const showControls = useShowControls();
  const { viewConfig } = useMapViews();
  const { boundariesPanelOpen } = useChoropleth();
  const compareGeographiesMode = useCompareGeographiesMode();
  const {
    pinDropMode,
    editAreaMode,
    setPinDropMode,
    setEditAreaMode,
    setCompareGeographiesMode,
  } = useMapControls();

  const currentMode = pinDropMode ? "pin_drop" : drawMode;

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

  let positionLeft = 16;
  if (showControls) {
    positionLeft += CONTROL_PANEL_WIDTH;
  }
  if (boundariesPanelOpen) {
    positionLeft += VISUALISATION_PANEL_WIDTH;
  }

  return (
    <>
      <div
        className="absolute top-5 z-10 duration-300 pointer-events-none right-4 flex justify-between items-start gap-4"
        style={{
          ...{ left: positionLeft + "px", bottom: "100px" },
          transition: "max-width 0.3s, transform 0.3s",
        }}
      >
        <BoundaryHoverInfo />
        <InspectorPanel />
      </div>

      <div
        className="absolute bottom-8 left-8 z-10 transition-transform duration-300 hidden md:block"
        style={{ left: positionLeft + "px" }}
      >
        <MapStyleSelector />
      </div>

      <div className="map-zoom-controls / absolute bottom-8 right-8 z-10 transition-transform duration-300 hidden md:block">
        <ZoomControl />
      </div>

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
          <div className="flex items-center gap-2 px-3 py-3 rounded shadow-md bg-white pointer-events-auto">
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
  );
}
