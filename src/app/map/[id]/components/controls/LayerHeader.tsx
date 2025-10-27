import { ChevronDown } from "lucide-react";
import React from "react";
import { cn } from "@/shadcn/utils";
import LayerTypeIcon from "../LayerTypeIcon";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import type { LayerType } from "@/types";

export default function LayerHeader({
  label,
  type,
  showLayer,
  setLayer,
  expanded,
  setExpanded,
  children,
}: {
  label: string;
  type: LayerType;
  showLayer: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;

  children?: React.ReactNode;
  setLayer?: (layer: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between relative">
      <div className="group / grow / flex items-center gap-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 hover:bg-neutral-100 rounded py-2 px-1 -m-1 my-1 / text-sm font-medium cursor-pointer",
            showLayer ? "opacity-100" : "opacity-70",
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

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {setLayer && (
            <LayerVisibilityToggle layer={showLayer} setLayer={setLayer} />
          )}
        </div>
      </div>

      <div className="shrink-0 transition-opacity ml-auto flex flex-row items-center">
        {children}
      </div>
    </div>
  );
}
