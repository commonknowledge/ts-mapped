import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Label } from "@/shadcn/ui/label";
import LayerVisibilityToggle from "./LayerVisibilityToggle";

export default function LayerHeader({
  label,
  color,
  showLayer,
  setLayer,
  expanded,
  setExpanded,
  children,
}: {
  label: string;
  showLayer: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;

  children?: React.ReactNode;
  color?: string;
  setLayer?: (layer: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between relative">
      <div className="group / grow / flex items-center gap-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:bg-neutral-100 rounded p-1 -m-1"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {color && (
            <div
              className="w-3 h-3 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: color,
                opacity: showLayer ? 1 : 0.5,
              }}
            ></div>
          )}

          <Label>{label}</Label>
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
