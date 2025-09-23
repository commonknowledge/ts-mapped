import React from "react";
import { Label } from "@/shadcn/ui/label";
import LayerCollapseToggle from "./LayerCollapseToggle";
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
  color: string;
  showLayer: boolean;
  setLayer: (layer: boolean) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between relative">
      <div className="group / grow / flex items-center gap-1">
        <div
          className="w-3 h-3 flex items-center justify-center rounded-full"
          style={{
            backgroundColor: color,
            opacity: showLayer && expanded ? 1 : 0.5,
          }}
        ></div>

        <Label>{label}</Label>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <LayerCollapseToggle expanded={expanded} setExpanded={setExpanded} />
          <LayerVisibilityToggle layer={showLayer} setLayer={setLayer} />
        </div>
      </div>

      <div className="shrink-0 transition-opacity ml-auto flex flex-row items-center">
        {children}
      </div>
    </div>
  );
}
