import { Grid3x3Icon } from "lucide-react";
import { mapColors } from "@/app/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";

function DotIcon({ color, size }: { color: string; size: number }) {
  return (
    <div
      className={` w-${size} h-${size} rounded-full`}
      style={{ backgroundColor: color }}
    ></div>
  );
}

function TurfIcon({ size }: { size: number }) {
  return (
    <div
      className={` w-${size} h-${size} rounded-xs border-2`}
      style={{
        backgroundColor: mapColors.areas.color + "50",
        borderColor: mapColors.areas.color,
      }}
    ></div>
  );
}

export default function LayerTypeIcon({
  type,
  className = "",
  size = 3,
}: {
  type: LayerType | undefined;
  className?: string;
  size?: number;
}) {
  const getIcon = () => {
    switch (type) {
      case LayerType.Member:
        return <DotIcon color={mapColors.member.color} size={size} />;
      case LayerType.Marker:
        return <DotIcon color={mapColors.markers.color} size={size} />;
      case LayerType.Turf:
        return <TurfIcon size={size} />;
      case LayerType.Boundary:
        return <Grid3x3Icon size={size * 5} />;
      default:
        return <></>;
    }
  };

  return <div className={cn(`shrink-0`, className)}>{getIcon()}</div>;
}
