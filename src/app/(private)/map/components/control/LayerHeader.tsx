import React from "react";
import { mapColors } from "../../styles";
import { Label } from "@/shadcn/ui/label";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shadcn/ui/button";
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
    <div className="flex flex-row gap-2 items-center group">
      <div
        style={{ backgroundColor: color }}
        className="rounded-full w-3 h-3"
      />
      <Label>{label}</Label>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex flex-row">
        {children}
        <LayerVisibilityToggle layer={showLayer} setLayer={setLayer} />
      </div>
    </div>
  );
}
