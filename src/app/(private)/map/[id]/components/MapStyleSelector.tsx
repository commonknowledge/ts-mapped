import { Paintbrush, Scan, Type } from "lucide-react";
import { useContext } from "react";
import { MapStyleName } from "@/__generated__/types";
import { ChoroplethContext } from "@/app/(private)/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shadcn/ui/select";
import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip } from "@/shadcn/ui/tooltip";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import mapStyles from "../styles";

export default function MapStyleSelector() {
  const { viewConfig, updateViewConfig } = useContext(MapContext);
  const { boundariesPanelOpen, setBoundariesPanelOpen } =
    useContext(ChoroplethContext);

  return (
    <div className="h-14 rounded-lg absolute left-1/2 bottom-8 -translate-x-1/2 py-2 px-4 z-10  bg-white  shadow-lg">
      <div className="flex gap-2 items-center h-full">
        <TooltipProvider>
          <Tooltip>
            <Select
              value={viewConfig.getMapStyle().name}
              onValueChange={(value) =>
                updateViewConfig({
                  mapStyleName: value as MapStyleName,
                })
              }
            >
              <TooltipTrigger asChild>
                <SelectTrigger className="border-0 p-1 gap-0 h-auto w-auto shadow-none bg-transparent hover:bg-accent">
                  <Paintbrush className="w-4 h-4 mr-1 text-muted-foreground" />
                </SelectTrigger>
              </TooltipTrigger>
              <SelectContent align="center">
                <Label className="p-2">Select Map Style</Label>
                {Object.keys(mapStyles).map((code) => (
                  <SelectItem
                    key={code}
                    value={mapStyles[code as keyof typeof mapStyles].name}
                  >
                    {mapStyles[code as keyof typeof mapStyles].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TooltipContent>
              <p>Map style</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={viewConfig.showLabels}
                onPressedChange={(value) =>
                  updateViewConfig({ showLabels: value })
                }
              >
                <Type
                  className={`w-4 h-4  text-muted-foreground ${
                    viewConfig.showLabels ? "opacity-100" : "opacity-50"
                  }`}
                />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{viewConfig.showLabels ? "Hide" : "Show"} labels</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={boundariesPanelOpen}
                onPressedChange={(value) => setBoundariesPanelOpen(value)}
                className={`relative ${boundariesPanelOpen ? "bg-neutral-200" : ""}`}
              >
                <Scan className="w-4 h-4  text-muted-foreground" />
                {viewConfig.areaSetGroupCode && (
                  <div
                    className={`absolute top-1 right-1  bg-neutral-500 rounded-full h-1.5 w-1.5  ${
                      boundariesPanelOpen ? "opacity-100" : "opacity-50"
                    }`}
                  />
                )}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{boundariesPanelOpen ? "Hide" : "Show"} boundaries</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
