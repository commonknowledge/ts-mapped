import { mapColors } from "@/app/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";

export default function LayerTypeIcon({
  type,
  className = "",
  size = 3,
}: {
  type: LayerType | undefined;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(`shrink-0 w-${size} h-${size} rounded-full`, className)}
      style={{
        backgroundColor:
          type === LayerType.Member
            ? mapColors.member.color
            : type === LayerType.Turf
              ? mapColors.areas.color
              : mapColors.markers.color,
      }}
    ></div>
  );
}
