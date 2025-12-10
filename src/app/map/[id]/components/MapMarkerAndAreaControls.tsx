import { useMarkerAndTurf } from "@/app/map/[id]/hooks/useMarkerAndTurf";
import { MapPin } from "lucide-react";
import { useContext } from "react";

import VectorSquare from "@/components/icons/VectorSquare";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";

export default function MapMarkerAndAreaControls() {
  const { handleAddArea, handleDropPin } = useMarkerAndTurf();

  return (
    <div className="flex gap-1 p-1 rounded-xl shadow-sm bg-white ">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-primary cursor-pointer"
            onClick={handleDropPin}
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
            onClick={handleAddArea}
          >
            <VectorSquare size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Add area</TooltipContent>
      </Tooltip>
    </div>
  );
}
