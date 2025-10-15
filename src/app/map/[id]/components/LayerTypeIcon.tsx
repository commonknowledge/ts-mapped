import { Grid3X3, MapPin, Users } from "lucide-react";
import { mapColors } from "@/app/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import DataSourceIcon from "@/components/DataSourceIcon";
import type { DataSource } from "@/server/models/DataSource";

export default function LayerTypeIcon({
  type,
  dataSource,
  className = "",
  size = 3,
}: {
  type: LayerType | undefined;
  dataSource?: DataSource | null;
  className?: string;
  size?: number;
}) {
  const iconSize = size === 2 ? "h-3 w-3" : size === 4 ? "h-4 w-4" : "h-3 w-3";

  // If we have a data source, use DataSourceIcon for consistency with layers control
  if (dataSource && (type === LayerType.Member || type === LayerType.Marker)) {
    return (
      <div className={cn("shrink-0", className)}>
        <DataSourceIcon type={dataSource.config?.type as string} />
      </div>
    );
  }

  if (type === LayerType.Boundary) {
    return (
      <div className={cn("shrink-0", className)}>
        <Grid3X3 className={cn(iconSize, "text-neutral-600")} />
      </div>
    );
  }

  if (type === LayerType.Member) {
    return (
      <div
        className={cn(`shrink-0 w-${size} h-${size} rounded-full`, className)}
        style={{
          backgroundColor: mapColors.member.color,
        }}
      ></div>
    );
  }

  if (type === LayerType.Turf) {
    return (
      <div
        className={cn(`shrink-0 w-${size} h-${size}`, className)}
        style={{
          backgroundColor: mapColors.areas.color,
        }}
      ></div>
    );
  }

  // Default marker icon (colored circle)
  return (
    <div
      className={cn(`shrink-0 w-${size} h-${size} rounded-full`, className)}
      style={{
        backgroundColor: mapColors.markers.color,
      }}
    ></div>
  );
}
