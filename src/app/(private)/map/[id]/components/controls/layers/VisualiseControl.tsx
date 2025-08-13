import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shadcn/ui/tooltip";

import { LandPlot, Pentagon, PlusIcon, Scan } from "lucide-react";
import { ChoroplethContext } from "../../../context/ChoroplethContext";
import { useContext } from "react";
import Legend from "../../Legend";
import { MapContext } from "../../../context/MapContext";
import { AREA_SET_GROUP_LABELS } from "../../../sources";
import { AreaSetGroupCode } from "@/__generated__/types";

export default function VisualiseControl() {
    const { boundariesPanelOpen, setBoundariesPanelOpen } = useContext(ChoroplethContext);
    const { viewConfig } = useContext(MapContext);

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Toggle
                            pressed={boundariesPanelOpen}
                            onPressedChange={(value) => setBoundariesPanelOpen(value)}
                            className={`relative p-3 rounded-none flex items-center justify-between ${boundariesPanelOpen ? "bg-neutral-200" : ""}`}
                        >
                            <div className="flex items-center gap-2">
                                <LandPlot className="w-4 h-4  text-muted-foreground" />
                                <h3 className="text-sm font-medium">Visualise Localities</h3>
                            </div>
                            {/* <PlusIcon className="w-4 h-4 text-muted-foreground" /> */}
                        </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{boundariesPanelOpen ? "Hide" : "Show"} boundaries</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="p-3 flex flex-col gap-2">
                <div className="flex flex-col gap-2 text-sm font-medium border border-neutral-200 rounded-sm p-2" >
                    <div className="flex gap-2 font-mono text-xs">
                        <Pentagon className="w-4 h-4 text-muted-foreground" />Selected Shape
                    </div>
                    {viewConfig.areaSetGroupCode ? AREA_SET_GROUP_LABELS[viewConfig.areaSetGroupCode as AreaSetGroupCode] : "No Locality"}</div>
                <Legend />
            </div>
        </>
    );
}