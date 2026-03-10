"use client";

import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useShowControls } from "@/app/map/[id]/hooks/useMapControls";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { CONTROL_PANEL_WIDTH } from "@/app/map/[id]/styles";
import LegendControl from "@/app/map/[id]/components/controls/BoundariesControl/LegendControl";
import { useBoundariesControl } from "@/app/map/[id]/components/controls/BoundariesControl/useBoundariesControl";
import { ChoroplethSettingsForm } from "@/app/map/[id]/components/controls/VisualisationPanel/VisualisationPanel";
import { cn } from "@/shadcn/utils";

const LEGEND_OFFSET = 12;

/**
 * Legend widget positioned top-left on the map.
 * Moves right when the layers panel is open. Clicking the legend expands to show choropleth settings.
 */
export default function LegendMapWidget() {
  const showControls = useShowControls();
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();
  const { hasDataSource } = useBoundariesControl();
  const { viewConfig } = useMapViews();

  const toggleExpanded = () => setBoundariesPanelOpen(!boundariesPanelOpen);

  const leftStyle = {
    left: showControls ? CONTROL_PANEL_WIDTH + LEGEND_OFFSET : LEGEND_OFFSET,
  };

  if (!hasDataSource) {
    return (
      <div
        className={cn(
          "absolute top-3 z-[100] rounded-lg shadow-lg bg-white border border-neutral-200",
          "cursor-pointer hover:bg-neutral-50 transition-[left] duration-300",
        )}
        style={leftStyle}
      >
        <button
          type="button"
          onClick={() => setBoundariesPanelOpen(true)}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Add visualisation
        </button>
        {boundariesPanelOpen && (
          <div className="border-t border-neutral-200 max-h-[min(70vh,500px)] overflow-y-auto">
            <ChoroplethSettingsForm onClose={() => setBoundariesPanelOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-3 z-[100] rounded-lg shadow-lg bg-white border border-neutral-200 overflow-hidden flex flex-col",
        "max-w-[320px] max-h-[min(85vh,600px)] transition-all duration-300",
        viewConfig.showChoropleth === false && "opacity-70",
      )}
      style={leftStyle}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        className="cursor-pointer hover:bg-neutral-50/50 transition-colors shrink-0"
      >
        <LegendControl />
      </div>
      {boundariesPanelOpen && (
        <div className="border-t border-neutral-200 flex-1 min-h-0 overflow-y-auto">
          <ChoroplethSettingsForm onClose={() => setBoundariesPanelOpen(false)} />
        </div>
      )}
    </div>
  );
}
