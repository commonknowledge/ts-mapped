import { UsersIcon, MapPinIcon, RectangleHorizontalIcon, LayoutDashboardIcon } from "lucide-react";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";

export default function LayerTypeIcon({
  type,
  className = "",
  size = 16,
}: {
  type: LayerType | undefined;
  className?: string;
  size?: number;
}) {
  const getIcon = () => {
    switch (type) {
      case LayerType.Member:
        return <UsersIcon size={size} />;
      case LayerType.Marker:
        return <MapPinIcon size={size} />;
      case LayerType.Turf:
        return <RectangleHorizontalIcon size={size} />;
      case LayerType.Boundary:
        return <LayoutDashboardIcon size={size} />;
      default:
        return <></>;
    }
  };

  return <div className={cn(`shrink-0`, className)}>{getIcon()}</div>;
}
