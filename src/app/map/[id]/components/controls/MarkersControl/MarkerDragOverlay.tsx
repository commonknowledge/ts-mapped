import { useMemo } from "react";
import { mapColors } from "@/app/map/[id]/styles";
import { useMapConfig } from "../../../hooks/useMapConfig";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function MarkerDragOverlay({
  marker,
}: {
  marker: PlacedMarker;
}) {
  const { mapConfig } = useMapConfig();
  const activeMarkerColor = useMemo(() => {
    // Get marker color (check explicit marker color first, then folder color, then default)
    if (mapConfig.placedMarkerColors?.[marker.id]) {
      return mapConfig.placedMarkerColors[marker.id];
    }
    if (marker.folderId && mapConfig.folderColors?.[marker.folderId]) {
      return mapConfig.folderColors[marker.folderId];
    }
    return mapColors.markers.color;
  }, [marker, mapConfig]);

  return (
    <div className="relative flex items-center gap-1 p-0.5 bg-white border border-blue-300 rounded shadow-lg pointer-events-none">
      <div
        className="absolute top-0 left-0 h-full w-1 shrink-0 rounded-xs"
        style={{ background: activeMarkerColor }}
      />
      <div className="grow pl-3">
        <span className="text-sm leading-relaxed flex-1 break-all">
          {marker.label}
        </span>
      </div>
    </div>
  );
}
