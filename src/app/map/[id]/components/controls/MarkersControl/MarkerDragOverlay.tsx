import { mapColors } from "@/app/map/[id]/styles";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function MarkerDragOverlay({
  marker,
  color,
}: {
  marker: PlacedMarker;
  color?: string;
}) {
  const markerColor = color || mapColors.markers.color;
  
  return (
    <div className="relative flex items-center gap-1 p-0.5 bg-white border border-blue-300 rounded shadow-lg pointer-events-none">
      <div
        className="absolute top-0 left-0 h-full w-1 shrink-0 rounded-xs"
        style={{ background: markerColor }}
      />
      <div className="grow pl-3">
        <span className="text-sm leading-relaxed flex-1 break-all">
          {marker.label}
        </span>
      </div>
    </div>
  );
}
