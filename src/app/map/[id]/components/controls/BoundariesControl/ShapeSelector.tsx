import { ChevronDown, Circle, Hexagon, MapPin } from "lucide-react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { AreaSetGroupCodeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { useBoundariesControl } from "./useBoundariesControl";

export default function ShapeSelector() {
  const { viewConfig } = useMapViews();
  const { shapeOptions } = useBoundariesControl();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-neutral-500">
        <Hexagon className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">Shape</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-2 px-2 shadow-none"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MapPin className="w-4 h-4 text-neutral-600 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {viewConfig?.areaSetGroupCode
                    ? AreaSetGroupCodeLabels[viewConfig?.areaSetGroupCode]
                    : "None"}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Choose Shape</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {shapeOptions.map((option, index) => (
            <DropdownMenuItem
              key={index}
              onClick={option.onClick}
              className="flex items-center gap-2"
            >
              <div className="flex-shrink-0">
                {index === 0 ? (
                  <Circle className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </div>
              <span className="truncate">{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
