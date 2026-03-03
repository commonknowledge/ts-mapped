import { mapColors } from "@/app/map/[id]/styles";
import { useFoldersQuery } from "../../../hooks/useFolders";
import { useMapConfig } from "../../../hooks/useMapConfig";
import type { Turf } from "@/server/models/Turf";

export default function TurfDragOverlay({ turf }: { turf: Turf }) {
  const { mapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const activeColor =
    turf.color ??
    folders.find((f) => f.id === turf.folderId)?.color ??
    mapConfig.turfColor ??
    mapColors.areas.color;

  return (
    <div className="relative flex items-center gap-1 p-0.5 bg-white border border-blue-300 rounded shadow-lg pointer-events-none">
      <div
        className="absolute top-0 left-0 h-full w-1 shrink-0 rounded-xs"
        style={{ background: activeColor }}
      />
      <div className="grow pl-3">
        <span className="text-sm leading-relaxed flex-1 break-all">
          {turf.label || `Area: ${turf.area?.toFixed(2)}m²`}
        </span>
      </div>
    </div>
  );
}
