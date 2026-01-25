"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/shadcn/utils";

const COLOR_PALETTE_DATA = [
  { hex: "#FF6B6B", name: "Red" },
  { hex: "#678DE3", name: "Blue" },
  { hex: "#4DAB37", name: "Green" },
  { hex: "#FFA500", name: "Orange" },
  { hex: "#9B59B6", name: "Purple" },
  { hex: "#1ABC9C", name: "Turquoise" },
  { hex: "#E67E22", name: "Carrot" },
  { hex: "#34495E", name: "Dark Blue Grey" },
  { hex: "#E74C3C", name: "Dark Red" },
  { hex: "#3498DB", name: "Light Blue" },
  { hex: "#2ECC71", name: "Emerald" },
  { hex: "#8E44AD", name: "Dark Purple" },
] as const;

export const DEFAULT_COLOR_PALETTE = COLOR_PALETTE_DATA.map((c) => c.hex);

const COLOR_NAMES: Record<string, string> = Object.fromEntries(
  COLOR_PALETTE_DATA.map((c) => [c.hex.toUpperCase(), c.name]),
);

const getColorLabel = (color: string): string => {
  const colorName = COLOR_NAMES[color.toUpperCase()];
  return colorName
    ? `Select ${colorName} color (${color})`
    : `Select color ${color}`;
};

export interface ColorPaletteProps {
  colors?: string[];
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export default function ColorPalette({
  colors = DEFAULT_COLOR_PALETTE,
  selectedColor,
  onColorSelect,
  className,
}: ColorPaletteProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2 p-2", className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onColorSelect(color)}
          aria-label={getColorLabel(color)}
          className={cn(
            "w-8 h-8 rounded border-2 transition-all hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            selectedColor === color
              ? "border-neutral-900 shadow-md"
              : "border-neutral-300 hover:border-neutral-400",
          )}
          style={{ backgroundColor: color }}
          title={color}
        >
          {selectedColor === color && (
            <CheckIcon className="w-4 h-4 text-white drop-shadow-md mx-auto" />
          )}
        </button>
      ))}
    </div>
  );
}
