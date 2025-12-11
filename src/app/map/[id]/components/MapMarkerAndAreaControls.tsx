import { useAtom } from "jotai";
import { ChartBar, MapPin } from "lucide-react";
import VectorSquare from "@/components/icons/VectorSquare";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { compareAreasAtom } from "../atoms/mapStateAtoms";
import { useHandleDropPin } from "../hooks/usePlacedMarkers";
import { useTurfState } from "../hooks/useTurfs";

export default function MapMarkerAndAreaControls() {
  const { handleDropPin } = useHandleDropPin();
  const { handleAddArea } = useTurfState();
  const [compareAreasMode, setCompareAreasMode] = useAtom(compareAreasAtom);

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
      <div className="w-px bg-neutral-200" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${
              compareAreasMode
                ? "bg-muted-foreground/30 text-primary"
                : "text-primary hover:bg-muted"
            }`}
            onClick={() => setCompareAreasMode(!compareAreasMode)}
          >
            <ChartBar size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Compare areas</TooltipContent>
      </Tooltip>
    </div>
  );
}
