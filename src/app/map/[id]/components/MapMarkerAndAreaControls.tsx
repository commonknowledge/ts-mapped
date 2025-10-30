import { MapPin } from "lucide-react";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useMapStore } from "@/app/map/[id]/stores/useMapStore";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import VectorSquare from "@/components/icons/VectorSquare";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { usePlacedMarkerMutations } from "../hooks/usePlacedMarkers";
import type { LngLat } from "mapbox-gl";

export default function MapMarkerAndAreaControls() {
  const mapRef = useMapStore((s) => s.mapRef);
  const handleAddArea = usePrivateMapStore((s) => s.handleAddArea);
  const handleDropPin = usePrivateMapStore((s) => s.handleDropPin);

  const { insertPlacedMarker } = usePlacedMarkerMutations();
  const onInsert = useCallback(
    (lngLat: LngLat) => {
      insertPlacedMarker({
        id: uuidv4(),
        label: `Dropped Pin (${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)})`,
        notes: "",
        point: lngLat,
        folderId: null,
      });
    },
    [insertPlacedMarker],
  );

  return (
    <div className="flex gap-1 p-1 rounded-xl shadow-sm bg-white ">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
            onClick={() => handleDropPin(mapRef, onInsert)}
          >
            <MapPin size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Add marker</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
            onClick={() => handleAddArea(mapRef)}
          >
            <VectorSquare size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Add area</TooltipContent>
      </Tooltip>
    </div>
  );
}
