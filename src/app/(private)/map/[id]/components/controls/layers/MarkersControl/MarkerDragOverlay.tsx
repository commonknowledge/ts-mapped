import { PlacedMarker } from "@/__generated__/types";
import { mapColors } from "@/app/(private)/map/[id]/styles";

export default function MarkerDragOverlay({
  marker,
}: {
  marker: PlacedMarker;
}) {
  return (
    <div
      className="flex items-center gap-2 p-1 bg-white border border-blue-300 rounded shadow-lg pointer-events-none"
      style={{
        transform: "translate(0%, -170%)",
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: mapColors.markers.color }}
      />
      <span className="text-sm">{marker.label}</span>
    </div>
  );
}
