"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/shadcn/utils";

export const DEFAULT_COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#678DE3", // Blue
  "#4DAB37", // Green
  "#FFA500", // Orange
  "#9B59B6", // Purple
  "#1ABC9C", // Turquoise
  "#E67E22", // Carrot/Orange
  "#34495E", // Dark Blue Grey
  "#E74C3C", // Dark Red
  "#3498DB", // Light Blue
  "#2ECC71", // Emerald
  "#8E44AD", // Dark Purple
];

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
    <div
      className={cn(
        "grid grid-cols-4 gap-2 p-2",
        className
      )}
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onColorSelect(color)}
          className={cn(
            "w-8 h-8 rounded border-2 transition-all hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            selectedColor === color
              ? "border-neutral-900 shadow-md"
              : "border-neutral-300 hover:border-neutral-400"
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
