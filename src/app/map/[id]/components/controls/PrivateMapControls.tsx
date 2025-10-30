import { PanelLeft } from "lucide-react";
import { useMapStore } from "@/app/map/[id]/stores/useMapStore";
import { Button } from "@/shadcn/ui/button";
import { CONTROL_PANEL_WIDTH } from "../../styles";

import BoundariesControl from "./BoundariesControl/BoundariesControl";
import MarkersControl from "./MarkersControl/MarkersControl";
import MembersControl from "./MembersControl/MembersControl";
import TurfsControl from "./TurfsControl/TurfsControl";

export default function PrivateMapControls() {
  const showControls = useMapStore((s) => s.showControls);
  const setShowControls = useMapStore((s) => s.setShowControls);
  const setBoundariesPanelOpen = useMapStore(
    (s) => s.setBoundariesPanelOpen,
  );

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
        <div className="flex flex-col h-full  bg-white/60 backdrop-blur-sm border-r border-neutral-200">
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
            className="flex-1 overflow-y-auto / flex flex-col gap-3 p-2"
            style={{ width: `${CONTROL_PANEL_WIDTH}px` }}
          >
            <MembersControl />
            <MarkersControl />
            <TurfsControl />
            <BoundariesControl />
          </div>
        </div>
      </div>
    </>
  );
}
