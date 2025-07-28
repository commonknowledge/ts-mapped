import React from "react";
import { Label } from "@/shadcn/ui/label";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
export default function LayerHeader({
  label,
  color,
  showLayer,
  setLayer,
  children,
}: {
  label: string;
  color: string;
  showLayer: boolean;
  setLayer: (layer: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-center gap-1 relative">
      <LayerVisibilityToggle
        layer={showLayer}
        setLayer={setLayer}
        backgroundColor={color}
      />

      <Label>{label}</Label>
      <div className=" transition-opacity ml-auto flex flex-row items-center">
        {children}
      </div>
    </div>
  );
}
