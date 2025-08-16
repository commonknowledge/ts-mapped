import { PanelLeft } from "lucide-react";
import Sidebar, {
  CONTROL_PANEL_WIDTH,
} from "@/components/Map/components/Sidebar";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import AreasControl from "./layers/AreasControl";
import MarkersControl from "./layers/MarkersControl/MarkersControl";
import MembersControl from "./layers/MembersControl";

export default function PrivateMapControls({
  showControls,
  setShowControls,
}: {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}) {
  return (
    <Sidebar showControls={showControls} setShowControls={setShowControls}>
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
    </Sidebar>
  );
}
