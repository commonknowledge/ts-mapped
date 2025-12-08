import { BarChart3, ChevronDown, Circle, Palette, Users } from "lucide-react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { CalculationType } from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { useBoundariesControl } from "./useBoundariesControl";

function getFillIcon(
  areaDataSourceId: string | null | undefined,
  calculationType: CalculationType | null | undefined,
) {
  if (!areaDataSourceId || areaDataSourceId === "") {
    return <Circle className="w-4 h-4" />;
  }
  if (calculationType === CalculationType.Count) {
    return <Users className="w-4 h-4" />;
  }
  return <BarChart3 className="w-4 h-4" />;
}

const getOptionIcon = (option: { label: string }) => {
  if (option.label === "No Fill") return <Circle className="w-4 h-4" />;
  if (option.label === "Member Count") return <Users className="w-4 h-4" />;
  return <BarChart3 className="w-4 h-4" />;
};

export default function FillSelector() {
  const { viewConfig } = useMapViews();
  const { fillLabel, fillOptions, hasShape } = useBoundariesControl();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-neutral-500">
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">Fill</span>
      </div>
      {!hasShape && (
        <div className="text-xs text-neutral-600 text-center py-2 px-3 bg-neutral-50 rounded-md">
          Select a boundary shape dataset to see the fill data
        </div>
      )}
      <div className={!hasShape ? "opacity-50 pointer-events-none" : ""}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-between h-auto py-2 px-2 shadow-none ${viewConfig.calculationType ? "" : "opacity-50"}`}
              disabled={!hasShape}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getFillIcon(
                    viewConfig?.areaDataSourceId,
                    viewConfig?.calculationType,
                  )}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {fillLabel}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Choose Fill Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fillOptions?.baseOptions.map((option, index) => (
              <DropdownMenuItem
                key={index}
                onClick={option.onClick}
                className="flex items-center gap-2"
              >
                <div className="flex-shrink-0">{getOptionIcon(option)}</div>
                <span className="truncate">{option.label}</span>
              </DropdownMenuItem>
            ))}
            {fillOptions?.voteShareOptions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="truncate">Vote Share</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {fillOptions?.voteShareOptions.map((option, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={option.onClick}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="truncate">{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
