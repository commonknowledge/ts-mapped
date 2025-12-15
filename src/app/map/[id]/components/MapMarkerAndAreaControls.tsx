import { ChartBar, MapPin } from "lucide-react";
import VectorSquare from "@/components/icons/VectorSquare";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { useMapControls } from "../hooks/useMapControls";
import { useHandleDropPin } from "../hooks/usePlacedMarkers";
import { useTurfState } from "../hooks/useTurfState";

export default function MapMarkerAndAreaControls() {
  const { handleDropPin } = useHandleDropPin();
  const { handleAddArea, cancelDrawMode } = useTurfState();
  const {
    pinDropMode,
    setPinDropMode,
    editAreaMode,
    compareGeographiesMode,
    setCompareGeographiesMode,
  } = useMapControls();

  const handlePinDropClick = () => {
    if (pinDropMode) {
      // If already in pin drop mode, cancel it
      setPinDropMode(false);
    } else {
      // Disable other modes first
      cancelDrawMode();
      setCompareGeographiesMode(false);
      // Then activate pin drop
      handleDropPin();
    }
  };

  const handleAddAreaClick = () => {
    if (editAreaMode) {
      // If already in edit area mode, cancel it
      cancelDrawMode();
    } else {
      // Disable other modes first
      setPinDropMode(false);
      setCompareGeographiesMode(false);
      // Then activate area drawing
      handleAddArea();
    }
  };

  return (
    <div className="flex gap-1 p-1 rounded-xl shadow-sm bg-white ">
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${
              pinDropMode
                ? "bg-muted-foreground/30 text-primary"
                : "text-primary hover:bg-muted"
            }`}
            onClick={handlePinDropClick}
          >
            <MapPin size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Add marker</TooltipContent>
      </Tooltip>
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${
              editAreaMode
                ? "bg-muted-foreground/30 text-primary"
                : "text-primary hover:bg-muted"
            }`}
            onClick={handleAddAreaClick}
          >
            <VectorSquare size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Add area</TooltipContent>
      </Tooltip>
      <div className="w-px bg-neutral-200" />
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${
              compareGeographiesMode
                ? "bg-muted-foreground/30 text-primary"
                : "text-primary hover:bg-muted"
            }`}
            onClick={() => {
              if (!compareGeographiesMode) {
                // Disable other modes first
                setPinDropMode(false);
                cancelDrawMode();
              }
              setCompareGeographiesMode(!compareGeographiesMode);
            }}
          >
            <ChartBar size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Compare geographies</TooltipContent>
      </Tooltip>
    </div>
  );
}
