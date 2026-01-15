import { ChevronDown } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useLayers } from "@/app/map/[id]/hooks/useLayers";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { TooltipProvider } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import LayerTypeIcon from "../LayerTypeIcon";
import type { LayerType } from "@/types";

export default function LayerHeader({
  label,
  type,
  expanded,
  setExpanded,
  children,
  enableVisibilityToggle = false,
}: {
  label: string;
  type: LayerType;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;

  children?: React.ReactNode;
  enableVisibilityToggle?: boolean;
}) {
  const { getLayerVisibility, hideLayer, showLayer } = useLayers();

  const isLayerVisible = getLayerVisibility(type);

  const toggleLayerVisiblity = () => {
    if (isLayerVisible) {
      hideLayer(type);
    } else {
      showLayer(type);
    }
  };

  return (
    <div className="flex items-center justify-between relative px-4 py-3 gap-2 min-w-0">
      <div className="group flex items-center gap-1 min-w-0 flex-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 hover:bg-neutral-100 rounded px-1 py-2 -mx-1 text-sm font-medium cursor-pointer min-w-0 flex-1",
            isLayerVisible ? "opacity-100" : "opacity-70",
          )}
        >
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform shrink-0",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />

          <LayerTypeIcon type={type} />

          <span className="truncate">{label}</span>
        </button>

        {enableVisibilityToggle && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded bg-neutral-100 hover:neutral-200 cursor-pointer"
                    aria-label="Toggle layer visibility"
                    onClick={() => toggleLayerVisiblity()}
                  >
                    {isLayerVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <>{isLayerVisible ? "Hide all" : "Show all"}</>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <div className="shrink-0 ml-auto flex flex-row items-center">
        {children}
      </div>
    </div>
  );
}
