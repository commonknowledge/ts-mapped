import { ChevronDown, ChevronRight } from "lucide-react";
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
          <button
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{expanded ? "Collapse" : "Expand"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
