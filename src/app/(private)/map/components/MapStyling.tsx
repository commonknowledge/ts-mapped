import { DataSourcesQuery } from "@/__generated__/types";
import { MapConfig } from "./Controls";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shadcn/ui/select";
import { Toggle } from "@/shadcn/ui/toggle";
import { Tooltip } from "@/shadcn/ui/tooltip";
import mapStyles from "../styles";
import { Paintbrush, Scan, Type } from "lucide-react";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

export function MapStyleSelector({
  mapConfig,
  onChange,
  dataSources,
}: {
  mapConfig: MapConfig;
  onChange: (mapConfig: Partial<MapConfig>) => void;
  dataSources: DataSourcesQuery["dataSources"];
}) {
  return (
    <div className="absolute left-1/2 -top-20 -translate-x-1/2 m-3 p-4 z-10  bg-white ">
      <div className="flex gap-2 items-center">
        <TooltipProvider>
          <Tooltip>
            <Select
              value={mapConfig.mapStyle.slug}
              onValueChange={(value) =>
                onChange({
                  mapStyle: mapStyles[value as keyof typeof mapStyles],
                })
              }
            >
              <TooltipTrigger asChild>
                <SelectTrigger className="border-0 p-1 gap-0 h-auto w-auto shadow-none bg-transparent hover:bg-accent">
                  <Paintbrush className="w-4 h-4 text-muted-foreground" />
                </SelectTrigger>
              </TooltipTrigger>
              <SelectContent align="center">
                <Label className="p-2">Select Map Style</Label>
                {Object.keys(mapStyles).map((code) => (
                  <SelectItem
                    key={code}
                    value={mapStyles[code as keyof typeof mapStyles].slug}
                  >
                    {mapStyles[code as keyof typeof mapStyles].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TooltipContent>
              <p>Map Style</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={mapConfig.showLabels}
                onPressedChange={(value) => onChange({ showLabels: value })}
              >
                <Type
                  className={`w-4 h-4  text-muted-foreground ${
                    mapConfig.showLabels ? "opacity-100" : "opacity-50"
                  }`}
                />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mapConfig.showLabels ? "Hide" : "Show"} labels</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={mapConfig.showBoundaryOutline}
                onPressedChange={(value) =>
                  onChange({ showBoundaryOutline: value })
                }
              >
                <Scan
                  className={`w-4 h-4  text-muted-foreground ${
                    mapConfig.showBoundaryOutline ? "opacity-100" : "opacity-50"
                  }`}
                />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {mapConfig.showBoundaryOutline ? "Hide" : "Show"} boundary
                outline
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
