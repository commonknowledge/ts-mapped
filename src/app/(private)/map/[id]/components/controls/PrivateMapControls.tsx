import { PanelLeft } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import AreasControl from "./layers/AreasControl";
import MarkersControl from "./layers/MarkersControl/MarkersControl";
import MembersControl from "./layers/MembersControl";

export const CONTROL_PANEL_WIDTH = 280;

export default function PrivateMapControls({
  showControls,
  setShowControls,
}: {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}) {
  return (
    <>
      {/* Toggle button - always visible */}
      <div className="flex absolute top-3 left-3 z-10 bg-white rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowControls(!showControls)}
        >
          <PanelLeft className="w-4 h-4" />
          <span className="sr-only">Toggle controls</span>
        </Button>
      </div>

      {/* Control panel with transition */}
      <div
        className={`absolute top-0 left-0 h-full transition-all duration-300 ease-in-out overflow-hidden z-20 ${
          showControls
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col bg-white z-10 h-full border-r border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-1 pr-1">
            <p className="text-sm font-semibold">Layers</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowControls(!showControls)}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle controls</span>
            </Button>
          </div>

          {/* Content */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{ width: `${CONTROL_PANEL_WIDTH}px` }}
          >
            <MembersControl />
            <Separator />
            <MarkersControl />
            <Separator />
            <AreasControl />
          </div>
        </div>
      </div>
    </>
  );
}
