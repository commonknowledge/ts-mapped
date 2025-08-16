import { PanelLeft } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/shadcn/ui/button";

export const CONTROL_PANEL_WIDTH = 280;

export default function Sidebar({
  showControls,
  setShowControls,
  children,
}: {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  children: ReactNode;
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
        style={{
          width: `${CONTROL_PANEL_WIDTH}px`,
          minWidth: `${CONTROL_PANEL_WIDTH}px`,
        }}
      >
        <div className="flex flex-col bg-white z-10 h-full border-r border-neutral-200">
          {children}
        </div>
      </div>
    </>
  );
}
