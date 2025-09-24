import { LandPlot, Pentagon } from "lucide-react";
import { useContext } from "react";
import { VisualisationType } from "@/__generated__/types";
import Legend from "@/components/Map/components/Legend";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { AreaSetGroupCodeLabels } from "@/labels";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import type { AreaSetGroupCode } from "@/__generated__/types";

export default function VisualiseControl() {
  const { boundariesPanelOpen, setBoundariesPanelOpen } =
    useContext(ChoroplethContext);
  const { viewConfig } = useContext(MapContext);

  return (
    <div
      className={`flex flex-col hover:bg-neutral-50 cursor-pointer border-r border-neutral-200 ${boundariesPanelOpen ? "bg-neutral-100" : ""}`}
      role="button"
      aria-pressed={boundariesPanelOpen}
      tabIndex={0}
      onClick={() => setBoundariesPanelOpen(!boundariesPanelOpen)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setBoundariesPanelOpen(!boundariesPanelOpen);
        }
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-3">
              <LandPlot className="w-4 h-4  text-muted-foreground" />
              <h3 className="text-sm font-medium">Visualise localities</h3>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{boundariesPanelOpen ? "Hide" : "Show"} localities panel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {viewConfig.visualisationType && (
        <>
          <div className="p-3 flex flex-col gap-2">
            <div className="flex flex-col gap-2 text-sm font-medium border border-neutral-200 rounded-sm p-2 bg-white">
              <div className="flex gap-2 font-mono text-xs">
                <Pentagon className="w-4 h-4 text-muted-foreground" />
                Selected Shape
              </div>
              {viewConfig.areaSetGroupCode
                ? AreaSetGroupCodeLabels[
                    viewConfig.areaSetGroupCode as AreaSetGroupCode
                  ]
                : "No Locality"}
            </div>
            {viewConfig.visualisationType === VisualisationType.Choropleth &&
              viewConfig.areaDataSourceId && <Legend />}
          </div>
        </>
      )}
    </div>
  );
}
