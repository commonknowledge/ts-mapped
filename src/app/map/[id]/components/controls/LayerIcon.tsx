"use client";

import { Folder, FolderOpen, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { MarkerCollectionIcon, MarkerIndividualIcon } from "../Icons";
import { LayerType } from "@/types";
import type { ComponentType } from "react";

// Color palette - 16 colors in a 4x4 grid
const COLOR_PALETTE = [
  "#678DE3", // Blue
  "#FF6B6B", // Red
  "#4DAB37", // Green
  "#9B59B6", // Purple
  "#F39C12", // Orange
  "#1ABC9C", // Teal
  "#E74C3C", // Dark Red
  "#3498DB", // Light Blue
  "#2ECC71", // Light Green
  "#E67E22", // Dark Orange
  "#16A085", // Dark Teal
  "#8E44AD", // Dark Purple
  "#F1C40F", // Yellow
  "#34495E", // Dark Blue
  "#E91E63", // Pink
  "#00BCD4", // Cyan
];

// Icon type definitions
type IconType =
  | "folder"
  | "folder-open"
  | "marker-collection"
  | "marker-individual"
  | "turf";

// Icon component props
interface IconProps {
  color: string;
  className?: string;
  style?: React.CSSProperties;
}

// Icon renderer function type
type IconRenderer = (props: IconProps) => JSX.Element;

// Icon type mapping - shows all available icon types
const getIconRenderer = (iconType: IconType, color: string): IconRenderer => {
  switch (iconType) {
    case "folder":
      return ({ className, style }) => (
        <Folder
          className={className}
          style={{
            fill: color,
            color: color,
            fillOpacity: 0.7,
            ...style,
          }}
        />
      );
    case "folder-open":
      return ({ className, style }) => (
        <FolderOpen
          className={className}
          style={{
            fill: color,
            color: color,
            fillOpacity: 0.7,
            ...style,
          }}
        />
      );
    case "marker-collection":
      return ({ className, style }) => <MarkerCollectionIcon color={color} />;
    case "marker-individual":
      return ({ className, style }) => <MarkerIndividualIcon color={color} />;
    case "turf":
      return ({ className, style }) => (
        <Square
          className={className}
          style={{ fill: color, color: color, fillOpacity: 0.3, ...style }}
        />
      );
    default:
      return ({ className, style }) => <MarkerIndividualIcon color={color} />;
  }
};

// Determine icon type based on props
const getIconType = (
  layerType: LayerType,
  isDataSource: boolean,
  isFolder: boolean,
  isFolderExpanded: boolean
): IconType => {
  if (isFolder) {
    return isFolderExpanded ? "folder-open" : "folder";
  }
  if (layerType === LayerType.Turf) {
    return "turf";
  }
  return isDataSource ? "marker-collection" : "marker-individual";
};

export default function LayerIcon({
  layerType,
  isDataSource = false,
  layerColor,
  onColorChange,
  isFolder = false,
  isFolderExpanded = false,
}: {
  layerType: LayerType;
  isDataSource?: boolean;
  layerColor: string;
  onColorChange?: (color: string) => void;
  isFolder?: boolean;
  isFolderExpanded?: boolean;
}) {
  const [selectedColor, setSelectedColor] = useState(layerColor);
  const [isOpen, setIsOpen] = useState(false);

  // Sync selectedColor with layerColor prop changes
  useEffect(() => {
    setSelectedColor(layerColor);
  }, [layerColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
    setIsOpen(false);
  };

  const currentColor = selectedColor || layerColor;
  const iconType = getIconType(
    layerType,
    isDataSource,
    isFolder,
    isFolderExpanded
  );
  const renderIcon = getIconRenderer(iconType, currentColor);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 border border-neutral-200 rounded-sm flex items-center justify-center shrink-0 mr-1 hover:border-neutral-300 transition-colors cursor-pointer relative"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {renderIcon({
            color: currentColor,
            className: "w-5 h-5 absolute",
          })}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-1">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`
                w-8 h-8 rounded-sm flex items-center justify-center
                border-2 transition-all relative
                hover:scale-110
                ${
                  currentColor === color
                    ? "border-neutral-900 shadow-sm"
                    : "border-transparent hover:border-neutral-300"
                }
              `}
            >
              {getIconRenderer(
                iconType,
                color
              )({
                color: color,
                className: "w-4 h-4 absolute",
              })}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
