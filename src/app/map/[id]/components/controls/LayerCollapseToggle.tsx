import { ChevronDown, ChevronRight } from "lucide-react";
import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

export default function LayerCollapseToggle({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: (layer: boolean) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={expanded}
            onPressedChange={setExpanded}
            className="w-6 h-6 p-0"
          >
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <p>{expanded ? "Collapse" : "Expand"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
