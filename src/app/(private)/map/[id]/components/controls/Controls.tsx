import { Columns } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";

import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import MarkersControl from "./MarkersControl";
import MembersControl from "./MembersControl";
import TurfControl from "./TurfControl";

export default function Controls() {
  const { mapRef, selectedDataSourceId } = useContext(MapContext);

  const [showControls, setShowControls] = useState(true);

  //reset map when ui shifts
  useEffect(() => {
    if (mapRef?.current) {
      // Delay the resize to allow the animation to complete
      const timeoutId = setTimeout(() => {
        if (mapRef?.current) {
          mapRef.current.resize();
        }
      }, 350); // Slightly longer than the CSS transition duration (300ms)

      return () => clearTimeout(timeoutId);
    }
  }, [selectedDataSourceId, showControls, mapRef]);

  const controlPanelWidth = 280;

  return (
    <>
      {/* Toggle button - always visible */}
      <div className="flex absolute top-17 left-3 z-10 bg-white rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowControls(!showControls)}
        >
          <Columns className="w-4 h-4" />
          <span className="sr-only">Toggle columns</span>
        </Button>
      </div>

      {/* Control panel with transition */}
      <div
        className={`flex flex-col bg-white z-10 h-full border-r border-neutral-200 transition-all duration-300 ease-in-out overflow-hidden ${
          showControls
            ? "translate-x-0 opacity- 100"
            : "-translate-x-full opacity-0"
        }`}
        style={{
          width: showControls ? `${controlPanelWidth}px` : "0px",
          minWidth: showControls ? `${controlPanelWidth}px` : "0px",
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-1 pr-1">
          <p className="text-sm font-semibold">Layers</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowControls(!showControls)}
          >
            <Columns className="w-4 h-4" />
            <span className="sr-only">Toggle columns</span>
          </Button>
        </div>
        <div style={{ width: `${controlPanelWidth}px` }}>
          <MembersControl />
          <Separator />
          <MarkersControl />
          <Separator />
          <TurfControl />
        </div>
      </div>
    </>
  );
}
