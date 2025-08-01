import { PlacedMarker } from "@/__generated__/types";
import { mapColors } from "@/app/(private)/map/[id]/styles";

export default function MarkerDragOverlay({
  marker,
}: {
  marker: PlacedMarker;
}) {
  return (
    <div className="flex items-center gap-2 p-0.5 bg-white border border-blue-300 rounded shadow-lg pointer-events-none">
      <div
        className="w-2 h-2 rounded-full aspect-square flex-shrink-0"
        style={{ backgroundColor: mapColors.markers.color }}
      />
      <span className="text-sm leading-relaxed flex-1 break-all">
        {marker.label}
      </span>
    </div>
  );
}
