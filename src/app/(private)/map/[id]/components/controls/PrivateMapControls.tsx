import { PanelLeft } from "lucide-react";
import { useContext, useEffect } from "react";

import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { CONTROL_PANEL_WIDTH } from "@/components/Map/styles";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import AreasControl from "./layers/AreasControl";
import MarkersControl from "./layers/MarkersControl/MarkersControl";
import MembersControl from "./layers/MembersControl";
import VisualiseControl from "./layers/VisualiseControl";

export default function PrivateMapControls() {
  const { ready, showControls, setShowControls } = useContext(MapContext);
  const { setBoundariesPanelOpen } = useContext(ChoroplethContext);

  const onToggleControls = () => {
    setShowControls(!showControls);
    if (showControls === true) {
      setBoundariesPanelOpen(false);
    }
  };

  // Animate show controls on component mount
  useEffect(() => {
    if (ready) {
      setShowControls(true);
    }
  }, [ready, setShowControls]);

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
        <div className="flex flex-col bg-white z-10 h-full border-r border-neutral-200">
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
            className="flex-1 overflow-y-auto"
            style={{ width: `${CONTROL_PANEL_WIDTH}px` }}
          >
            <MembersControl />
            <Separator />
            <MarkersControl />
            <Separator />
            <AreasControl />
          </div>
          <div className="sticky bottom-0 left-0 w-full bg-white">
            <Separator />
            <VisualiseControl />
          </div>
        </div>
      </div>
    </>
  );
}
