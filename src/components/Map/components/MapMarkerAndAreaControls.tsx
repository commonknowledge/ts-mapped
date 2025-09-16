import { MapPin } from "lucide-react";
import { useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import VectorSquare from "@/components/icons/VectorSquare";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";

export default function MapMarkerAndAreaControls() {
  const { mapRef } = useContext(MapContext);
  const { insertPlacedMarker } = useContext(MarkerAndTurfContext);

  const handleAddArea = () => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon"
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  };

  const handleDropPin = () => {
    const map = mapRef?.current;
    if (map) {
      map.getCanvas().style.cursor = "crosshair";

      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        insertPlacedMarker({
          id: uuidv4(),
          label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
          notes: "",
          point: e.lngLat,
          folderId: null,
        });

        // Reset cursor
        map.getCanvas().style.cursor = "";
        map.off("click", clickHandler);

        // Fly to the new marker
        map.flyTo({
          center: e.lngLat,
          zoom: 14,
        });
      };

      map.once("click", clickHandler);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex gap-1 p-1 rounded-xl shadow-sm bg-white ">
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
              onClick={() => handleDropPin()}
            >
              <MapPin size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add marker</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
              onClick={() => handleAddArea()}
            >
              <VectorSquare size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add area</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
