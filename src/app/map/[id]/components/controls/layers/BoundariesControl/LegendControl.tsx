import { Eye } from "lucide-react";
import Legend from "@/app/map/[id]/components/Legend";
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
import type { ColorScheme } from "@/server/models/MapView";

interface LegendControlProps {
  disabled: boolean;
  isChoroplethVisible: boolean;
  visualisationType: VisualisationType | null | undefined;
  reverseColorScheme: boolean;
  colorSchemeOptions: {
    label: string;
    value: ColorScheme;
    color: string;
  }[];
  onToggleChoropleth: () => void;
  onUpdateColorScheme: (colorScheme: ColorScheme) => void;
  onToggleReverse: (checked: boolean) => void;
}

export function LegendControl({
  disabled,
  isChoroplethVisible,
  visualisationType,
  reverseColorScheme,
  colorSchemeOptions,
  onToggleChoropleth,
  onUpdateColorScheme,
  onToggleReverse,
}: LegendControlProps) {
  return (
    <div
      className={`space-y-1 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        className={`flex items-center bg-white cursor-pointer group relative ${visualisationType === VisualisationType.BoundaryOnly ? "opacity-50" : ""}`}
      >
        <button
          className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2"
          onClick={onToggleChoropleth}
          disabled={disabled}
        >
          <Eye
            className={`w-4 h-4 ${isChoroplethVisible ? "text-neutral-500" : "text-neutral-400"}`}
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <Legend />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Choose Color Scheme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {colorSchemeOptions.map((option, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => onUpdateColorScheme(option.value)}
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
                checked={Boolean(reverseColorScheme)}
                onCheckedChange={onToggleReverse}
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
