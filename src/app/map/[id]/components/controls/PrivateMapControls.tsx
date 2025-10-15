import { PanelLeft } from "lucide-react";
import { useContext } from "react";

import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import { CONTROL_PANEL_WIDTH } from "../../styles";
import AreasControl from "./layers/AreasControl";
import BoundariesControl from "./layers/BoundariesControl";
import MarkersControl from "./layers/MarkersControl/MarkersControl";
import MembersControl from "./layers/MembersControl";

export default function PrivateMapControls() {
  const { showControls, setShowControls } = useContext(MapContext);
  const { setBoundariesPanelOpen } = useContext(ChoroplethContext);

  const onToggleControls = () => {
    setShowControls(!showControls);
    if (showControls === true) {
      setBoundariesPanelOpen(false);
    }
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <div className="flex absolute top-3 left-3 z-10 bg-white rounded-lg shadow-lg">
        <Button variant="ghost" size="icon" onClick={() => onToggleControls()}>
          <PanelLeft className="w-4 h-4" />
          <span className="sr-only">Toggle controls</span>
        </Button>
      </div>

      {/* Control panel with transition */}
      <div
        className={`absolute top-0 left-0 z-20 h-full overflow-hidden transition-all duration-300 ease-in-out ${showControls
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
          }`}
        style={{
          width: `${CONTROL_PANEL_WIDTH}px`,
          minWidth: `${CONTROL_PANEL_WIDTH}px`,
        }}
      >
        <div className="flex flex-col bg-white/60 backdrop-blur-sm z-10 h-full border-r border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-neutral-200">
            <p className="text-sm font-semibold">Layers</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleControls()}
              className="h-6 w-6"
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle controls</span>
            </Button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-3"
            style={{ width: `${CONTROL_PANEL_WIDTH}px` }}
          >
            <MembersControl />
            <MarkersControl />
            <AreasControl />
            <BoundariesControl />
          </div>
        </div>
      </div>
    </>
  );
}
