"use client";

import {
  EllipsisIcon,
  LoaderPinwheelIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import { DUMMY_COUNT_COLUMN, MAX_COLUMN_KEY } from "@/constants";
import { useDataSources } from "@/hooks/useDataSources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { useColorScheme } from "../../colors";
import BivariateLegend from "../../components/BivariateLagend";
import { LegendBars } from "../../components/Legend/LegendBars";
import { useAreaStats } from "../../data";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useMapViews } from "../../hooks/useMapViews";
import LightBoundaryPicker from "./LightBoundaryPicker";
import type { SavedVisualisation } from "@/models/MapView";

const getColumnLabel = (item: SavedVisualisation) => {
  const column = item.areaDataColumn;
  if (!column) return "Choose a column";
  if (column === DUMMY_COUNT_COLUMN) return "Record count";
  if (column === MAX_COLUMN_KEY) return "Highest value column";
  return item.areaDataSecondaryColumn
    ? `${column} × ${item.areaDataSecondaryColumn}`
    : column;
};

// One column of a data source's Areas group: click to colour the map by it,
// click again to turn it off. The active one opens into a card with its
// boundaries and legend.
export default function LightVisualisationRow({
  item,
  isActive,
  onSelect,
  onDeactivate,
  onEdit,
  onRemove,
  lockedNote,
}: {
  item: SavedVisualisation;
  isActive: boolean;
  onSelect: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onRemove: () => void;
  /** Set while locked boundaries don't fit this data, e.g. "Not available
   *  by Councils · shown by UK Region" */
  lockedNote?: string | null;
}) {
  const { boundariesPanelOpen } = useChoropleth();
  const { viewConfig } = useMapViews();
  const label = getColumnLabel(item);

  return (
    <li
      // Inside its source's card: the active column is a tinted block
      className={cn(
        "rounded-md transition-colors",
        isActive && (boundariesPanelOpen ? "bg-neutral-100" : "bg-neutral-50"),
      )}
    >
      <div
        className={cn(
          "group/column flex items-center gap-1 rounded-lg pr-1 transition-colors",
          !isActive && "hover:bg-neutral-50",
          // Greyed while the locked boundaries don't fit; still selectable
          !isActive && lockedNote && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={isActive ? onDeactivate : onSelect}
          aria-pressed={isActive}
          title={isActive ? "Turn off" : "Colour the map by this"}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 pr-1.5 pl-[1.625rem] text-left"
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              isActive ? "bg-neutral-900" : "bg-neutral-300",
            )}
          />
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate text-xs",
                isActive ? "font-medium text-neutral-900" : "text-neutral-600",
              )}
            >
              {label}
            </span>
            {lockedNote && (
              <span className="block truncate text-[11px] text-neutral-400">
                {lockedNote}
              </span>
            )}
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${label} options`}
              className={cn(
                "cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 focus-visible:opacity-100 data-[state=open]:opacity-100",
                !isActive && "opacity-0 group-hover/column:opacity-100",
              )}
            >
              <EllipsisIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <SlidersHorizontalIcon className="size-3.5" />
              Edit visualisation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <TrashIcon className="size-3.5" />
              Remove column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isActive && (
        <div className="flex flex-col gap-2 px-2 pt-1 pb-2.5 [&_[data-slot=select-trigger]]:bg-white">
          {!viewConfig.boundariesLocked && (
            <LightBoundaryPicker
              label="by"
              dataSourceId={item.areaDataSourceId}
            />
          )}
          <ActiveLegend />
        </div>
      )}
    </li>
  );
}

// The compact colour key for the visualisation currently on the map
function ActiveLegend() {
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(viewConfig.areaDataSourceId);
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const colorScheme = useColorScheme({ areaStats, viewConfig });
  const column = viewConfig.areaDataColumn;

  if (areaStatsQuery?.isFetching) {
    return (
      <LoaderPinwheelIcon className="size-4 animate-spin text-neutral-400" />
    );
  }
  if (
    column &&
    column !== DUMMY_COUNT_COLUMN &&
    viewConfig.areaDataSecondaryColumn
  ) {
    return <BivariateLegend />;
  }
  if (column && colorScheme) {
    return (
      <LegendBars
        colorScheme={colorScheme}
        viewConfig={viewConfig}
        areaStats={areaStats}
        dataSource={dataSource}
        compact
      />
    );
  }
  return null;
}
