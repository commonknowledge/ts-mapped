import { PanelLeft } from "lucide-react";

import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { MapType } from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { useShowControlsAtom } from "../../hooks/useMapControls";
import { useMapViews } from "../../hooks/useMapViews";
import { CONTROL_PANEL_WIDTH } from "../../styles";
import CollapsedPanelButton from "../CollapsedPanelButton";

import BoundariesControl from "./BoundariesControl/BoundariesControl";
import MarkersControl from "./MarkersControl/MarkersControl";
import TurfsControl from "./TurfsControl/TurfsControl";

export default function PrivateMapControls() {
  const [showControls, setShowControls] = useShowControlsAtom();
  const { setBoundariesPanelOpen } = useChoropleth();
  const { viewConfig } = useMapViews();

  const onToggleControls = () => {
    setShowControls(!showControls);
    if (showControls === true) {
      setBoundariesPanelOpen(false);
    }
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <CollapsedPanelButton
        icon={PanelLeft}
        onClick={() => onToggleControls()}
        ariaLabel="Toggle controls"
        className="left-3"
      />

      {/* Control panel with transition */}
      <div
        className={`absolute top-0 left-0 z-20 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          showControls
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        }`}
        style={{
          width: `${CONTROL_PANEL_WIDTH}px`,
          minWidth: `${CONTROL_PANEL_WIDTH}px`,
        }}
      >
        <div className="flex flex-col h-full  bg-white border-r border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-1 pr-1">
            <p className="text-sm font-semibold">Layers</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleControls()}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle controls</span>
            </Button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto / flex flex-col"
            style={{ width: `${CONTROL_PANEL_WIDTH}px` }}
          >
            {viewConfig.mapType !== MapType.Hex && (
              <>
                <MarkersControl />
                <TurfsControl />
              </>
            )}
            <BoundariesControl />
          </div>
        </div>
      </div>
    </>
  );
}
