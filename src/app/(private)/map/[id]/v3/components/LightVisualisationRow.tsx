"use client";

import {
  ColumnsIcon,
  EllipsisIcon,
  LoaderPinwheelIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import DataSourceIcon from "@/components/DataSourceIcon";
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

export default function LightVisualisationRow({
  item,
  isActive,
  onSelect,
  onEdit,
  onAddColumn,
  onRemove,
}: {
  item: SavedVisualisation;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onAddColumn: () => void;
  onRemove: () => void;
}) {
  const { getDataSourceById } = useDataSources();
  const { boundariesPanelOpen } = useChoropleth();
  const dataSource = getDataSourceById(item.areaDataSourceId);

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md pr-1 transition-colors",
          isActive
            ? boundariesPanelOpen
              ? "bg-neutral-100"
              : "bg-neutral-50"
            : "hover:bg-neutral-50",
        )}
      >
        <button
          type="button"
          onClick={isActive ? onEdit : onSelect}
          aria-pressed={isActive}
          title={isActive ? "Edit visualisation" : "Show on map"}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 px-1.5 py-1.5 text-left"
        >
          <span
            className={cn(
              "mt-0.5 flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5",
              !isActive && "opacity-50",
            )}
          >
            <DataSourceIcon type={dataSource?.config?.type ?? "unknown"} />
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate",
                isActive ? "font-medium" : "text-neutral-600",
              )}
            >
              {dataSource?.name ?? "Data source"}
            </span>
            <span className="block truncate text-xs text-neutral-500">
              {getColumnLabel(item)}
            </span>
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${dataSource?.name ?? "Visualisation"} options`}
              className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900"
            >
              <EllipsisIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <SlidersHorizontalIcon className="size-3.5" />
              Edit visualisation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddColumn}>
              <ColumnsIcon className="size-3.5" />
              Add another column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <TrashIcon className="size-3.5" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isActive && (
        <div className="px-1.5 pt-1.5 pb-2">
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
