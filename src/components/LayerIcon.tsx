import { Grid3X3 } from "lucide-react";
import { mapColors } from "@/app/map/[id]/styles";
import DataSourceIcon from "@/components/DataSourceIcon";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import type { DataSource } from "@/server/models/DataSource";

interface LayerIconProps {
  type: LayerType;
  dataSource?: DataSource | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const iconSizes = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export default function LayerIcon({
  type,
  dataSource,
  className = "",
  size = "md",
}: LayerIconProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  // Members - Blue circle
  if (type === LayerType.Member) {
    // Simple blue circle
    return (
      <div
        className={cn(`shrink-0 ${sizeClass} rounded-full`, className)}
        style={{
          backgroundColor: mapColors.member.color,
        }}
      />
    );
  }

  // Markers - Red circle (default marker icon)
  if (type === LayerType.Marker) {
    if (dataSource) {
      // Use DataSourceIcon for consistency with layers control
      return (
        <div className={cn("shrink-0", className)}>
          <DataSourceIcon type={dataSource.config?.type as string} />
        </div>
      );
    }

    // Fallback to red circle
    return (
      <div
        className={cn(`shrink-0 ${sizeClass} rounded-full`, className)}
        style={{
          backgroundColor: mapColors.markers.color,
        }}
      />
    );
  }

  // Areas - Green square
  if (type === LayerType.Turf) {
    return (
      <div
        className="w-3.5 h-3.5 rounded-xs"
        style={{
          border: `2px solid ${mapColors.areas.color}`,
          backgroundColor: mapColors.areas.color + "50",
        }}
      />
    );
  }

  // Boundaries - Grid icon
  if (type === LayerType.Boundary) {
    return (
      <div className={cn("shrink-0", className)}>
        <Grid3X3 className={cn(iconSize, "text-neutral-600 w-4 h-4")} />
      </div>
    );
  }

  // Default fallback
  return (
    <div
      className={cn(`shrink-0 ${sizeClass} rounded-full`, className)}
      style={{
        backgroundColor: mapColors.markers.color,
      }}
    />
  );
}
