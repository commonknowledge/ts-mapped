import { PanelLeft } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import AreasControl from "./layers/AreasControl";
import MarkersControl from "./layers/MarkersControl/MarkersControl";
import MembersControl from "./layers/MembersControl";
import VisualiseControl from "./layers/VisualiseControl";

export default function Controls({
  controlPanelWidth,
  showControls,
  setShowControls,
}: {
  controlPanelWidth: number;
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
        className={`h-full transition-all duration-300 ease-in-out overflow-hidden z-20 ${
          showControls
            ? "block"
            : "hidden"
        }`}
        style={{
          width: `${controlPanelWidth}px`,
          minWidth: `${controlPanelWidth}px`,
        }}
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
            className="flex flex-col overflow-y-auto flex-1"
            style={{ width: `${controlPanelWidth}px` }}
          >
            <MembersControl />
            <Separator />
            <MarkersControl />
            <Separator />
            <AreasControl />
            <div className="flex flex-col  mt-auto">
              <Separator />
              <VisualiseControl />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
