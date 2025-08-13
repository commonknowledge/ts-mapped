import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shadcn/ui/tooltip";

import { LandPlot, Scan } from "lucide-react";
import { ChoroplethContext } from "../../../context/ChoroplethContext";
import { useContext } from "react";

export default function VisualiseControl() {
    const { boundariesPanelOpen, setBoundariesPanelOpen } = useContext(ChoroplethContext);

    return (
        <TooltipProvider>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={boundariesPanelOpen}
                        onPressedChange={(value) => setBoundariesPanelOpen(value)}
                        className={`relative p-6 rounded-none ${boundariesPanelOpen ? "bg-neutral-200" : ""}`}
                    >
                        <LandPlot className="w-4 h-4  text-muted-foreground" />
                        <h3 className="text-sm font-medium">Visualise Map</h3>

                    </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{boundariesPanelOpen ? "Hide" : "Show"} boundaries</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}