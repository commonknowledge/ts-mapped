import { Eye } from "lucide-react";
import Legend from "@/app/map/[id]/components/Legend";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { VisualisationType } from "@/server/models/MapView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Switch } from "@/shadcn/ui/switch";
import { useBoundariesControl } from "./useBoundariesControl";

export function LegendControl() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const {
    isChoroplethVisible,
    toggleChoropleth,
    colorSchemeOptions,
    hasShape,
  } = useBoundariesControl();

  return (
    <div
      className={`space-y-1 ${!hasShape ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        className={`flex items-center bg-white cursor-pointer group relative ${viewConfig?.visualisationType === VisualisationType.BoundaryOnly ? "opacity-50" : ""}`}
      >
        <button
          className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2"
          onClick={toggleChoropleth}
          disabled={!hasShape}
        >
          <Eye
            className={`w-4 h-4 ${isChoroplethVisible ? "text-neutral-500" : "text-neutral-400"}`}
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer w-54">
              <Legend />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Choose Color Scheme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {colorSchemeOptions.map((option, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => updateViewConfig({ colorScheme: option.value })}
                className="flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded ${option.color}`} />
                <span className="truncate">{option.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Switch
                id="reverse-color-scheme-switch"
                checked={Boolean(viewConfig?.reverseColorScheme)}
                onClick={() =>
                  updateViewConfig({
                    reverseColorScheme: !viewConfig?.reverseColorScheme,
                  })
                }
                onCheckedChange={() =>
                  updateViewConfig({
                    reverseColorScheme: !viewConfig?.reverseColorScheme,
                  })
                }
              />
              <label
                htmlFor="reverse-color-scheme-switch"
                className="text-sm cursor-pointer"
              >
                Reverse colors
              </label>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
