"use client";

import { ChevronDown, PaintBucket, Palette, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useShowControls } from "@/app/map/[id]/hooks/useMapControls";
import { CONTROL_PANEL_WIDTH } from "@/app/map/[id]/styles";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import Legend from "./Legend";
import VisualisationPanel from "./controls/VisualisationPanel/VisualisationPanel";
import { useBoundariesControl } from "./controls/BoundariesControl/useBoundariesControl";

export default function FloatingVisualisationPanel() {
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();
  const { viewConfig } = useMapViews();
  const { hasDataSource } = useBoundariesControl();
  const showControls = useShowControls();
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-expand when settings are being edited/changed
  useEffect(() => {
    if (boundariesPanelOpen) {
      setIsCollapsed(false);
    }
  }, [
    boundariesPanelOpen,
    viewConfig.areaDataSourceId,
    viewConfig.areaDataColumn,
    viewConfig.calculationType,
  ]);

  // Show if there's a data source or if the panel is open
  const shouldShow =
    hasDataSource || viewConfig.areaDataSourceId || boundariesPanelOpen;

  if (!shouldShow) {
    return null;
  }

  // Apply positioning logic: shift right when layers panel is open, and also shift right when closed to avoid toggle button
  const positionLeft = {
    transform: showControls
      ? `translateX(calc(${CONTROL_PANEL_WIDTH}px))`
      : "translateX(48px)", // Move right by 48px (3rem) when panel is closed to avoid the toggle button
  };

  return (
    <div
      className="absolute top-3 left-3 z-30 flex flex-col gap-2 transition-transform duration-300"
      style={positionLeft}
    >
      {/* Collapsed state - shows legend button */}
      {isCollapsed ? (
        <div className="bg-white rounded-lg shadow-lg border border-neutral-200">
          <div className="flex flex-col gap-2 p-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCollapsed(false);
                setBoundariesPanelOpen(true);
              }}
              className="h-auto w-full justify-start gap-2 px-2 py-1.5"
              aria-label="Show visualization settings"
            >
              <PaintBucket className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Visualiser</span>
              <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0 text-neutral-400" />
            </Button>
            {hasDataSource && (
              <div className="flex-1 min-w-0">
                <Legend />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Expanded state - shows full panel */
        <div className="bg-white rounded-lg shadow-lg border border-neutral-200 w-80 max-h-[calc(100vh-6rem)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <PaintBucket className="w-4 h-4 text-neutral-600" />
              <h3 className="text-sm font-semibold">Visualiser</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-7 w-7"
                aria-label="Collapse"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    !isCollapsed && "rotate-180"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setBoundariesPanelOpen(false);
                  setIsCollapsed(true);
                }}
                className="h-7 w-7"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {hasDataSource && (
              <div className="p-3 border-b border-neutral-200">
                <Legend />
              </div>
            )}
            {boundariesPanelOpen && (
              <div className="relative">
                <VisualisationPanel positionLeft={0} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
