import React from "react";
import { mapColors } from "../../styles";
import { Label } from "@/shadcn/ui/label";
import LayerVisibilityToggle from "./LayerVisibilityToggle";

export default function LayerHeader({
  label,
  color,
  showLayer,
  setLayer,
}: {
  label: string;
  color: string;
  showLayer: boolean;
  setLayer: (layer: boolean) => void;
}) {
  return (
    <div className="flex flex-row gap-2 items-center group">
      <div
        style={{ backgroundColor: color }}
        className="rounded-full w-3 h-3"
      />
      <Label>{label}</Label>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
        <LayerVisibilityToggle layer={showLayer} setLayer={setLayer} />
      </div>
    </div>
  );
}
