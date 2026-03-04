"use client";

import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import LegendControl from "@/app/map/[id]/components/controls/BoundariesControl/LegendControl";
import { useBoundariesControl } from "@/app/map/[id]/components/controls/BoundariesControl/useBoundariesControl";
import { cn } from "@/shadcn/utils";

/**
 * Compact legend widget positioned top-left over the map.
 * Shows the choropleth legend; when clicked opens the visualisation settings panel.
 */
export default function LegendMapWidget() {
  const { setBoundariesPanelOpen } = useChoropleth();
  const { hasDataSource } = useBoundariesControl();
  const { viewConfig } = useMapViews();

  if (!hasDataSource) {
    return (
      <div
        className={cn(
          "absolute top-3 left-3 z-10 rounded-lg shadow-lg bg-white border border-neutral-200",
          "cursor-pointer hover:bg-neutral-50 transition-colors",
        )}
      >
        <button
          type="button"
          onClick={() => setBoundariesPanelOpen(true)}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Add visualisation
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-3 left-3 z-10 rounded-lg shadow-lg bg-white border border-neutral-200 overflow-hidden",
        "max-w-[220px] max-h-[min(60vh,400px)] overflow-y-auto",
        viewConfig.showChoropleth === false && "opacity-70",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setBoundariesPanelOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setBoundariesPanelOpen(true);
          }
        }}
        className="cursor-pointer hover:bg-neutral-50/50 transition-colors"
      >
        <LegendControl />
      </div>
    </div>
  );
}
