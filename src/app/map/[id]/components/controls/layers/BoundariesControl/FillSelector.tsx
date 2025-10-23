import { BarChart3, ChevronDown, Circle, Palette, Users } from "lucide-react";
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

interface FillSelectorProps {
  disabled: boolean;
  fillLabel: string;
  isChoroplethVisible: boolean;
  areaDataSourceId: string | undefined;
  calculationType: CalculationType | null | undefined;
  baseOptions: { label: string; onClick: () => void }[];
  voteShareOptions: { label: string; onClick: () => void }[];
}

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

export function FillSelector({
  disabled,
  fillLabel,
  isChoroplethVisible,
  areaDataSourceId,
  calculationType,
  baseOptions,
  voteShareOptions,
}: FillSelectorProps) {
  const getIcon = (index: number, option: { label: string }) => {
    if (option.label === "No Fill") return <Circle className="w-4 h-4" />;
    if (option.label === "Member Count") return <Users className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-neutral-500">
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">Fill</span>
      </div>
      {disabled && (
        <div className="text-xs text-neutral-600 text-center py-2 px-3 bg-neutral-50 rounded-md">
          Select a boundary shape dataset to see the fill data
        </div>
      )}
      <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-between h-auto py-2 px-2 shadow-none ${!isChoroplethVisible ? "opacity-50" : ""}`}
              disabled={disabled}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getFillIcon(areaDataSourceId, calculationType)}
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
            {baseOptions.map((option, index) => (
              <DropdownMenuItem
                key={index}
                onClick={option.onClick}
                className="flex items-center gap-2"
              >
                <div className="flex-shrink-0">{getIcon(index, option)}</div>
                <span className="truncate">{option.label}</span>
              </DropdownMenuItem>
            ))}
            {voteShareOptions.length > 0 && (
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
                    {voteShareOptions.map((option, index) => (
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
