import { ChevronDown } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useContext } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
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
  const { getLayerVisibility, hideLayer, showLayer } =
    useContext(MarkerAndTurfContext);

  const isLayerVisible = getLayerVisibility(type);

  const toggleLayerVisiblity = () => {
    if (isLayerVisible) {
      hideLayer(type);
    } else {
      showLayer(type);
    }
  };

  return (
    <div className="flex items-center justify-between relative">
      <div className="group / grow / flex items-center gap-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 hover:bg-neutral-100 rounded py-2 px-1 -m-1 my-1 / text-sm font-medium cursor-pointer",
            isLayerVisible ? "opacity-100" : "opacity-70",
          )}
        >
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />

          <LayerTypeIcon type={type} />

          {label}
        </button>

        {enableVisibilityToggle && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
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

      <div className="shrink-0 transition-opacity ml-auto flex flex-row items-center">
        {children}
      </div>
    </div>
  );
}
