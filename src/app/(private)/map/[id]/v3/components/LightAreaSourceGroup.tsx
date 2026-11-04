"use client";

import {
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  PanelRightIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useDataSources } from "@/hooks/useDataSources";
import { DataSourceTypeLabels } from "@/labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import OnMapBadge from "../../components/OnMapBadge";
import RingSwatch from "../../components/RingSwatch";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import type { ReactNode } from "react";

// A data source in the Areas list. Its header turns it on or off the map;
// with several columns they sit underneath, with one the header stands for
// it. One group is one inspector tab, in the same order.
export default function LightAreaSourceGroup({
  dataSourceId,
  hasActive,
  subtitle,
  onToggle,
  onEdit,
  isInInspector,
  onToggleInspector,
  onEditInspector,
  onAddColumn,
  onRemove,
  children,
}: {
  dataSourceId: string;
  /** One of its columns is colouring the map */
  hasActive: boolean;
  /** The column, when the source has only one */
  subtitle?: string;
  /** Shows the source on the map, or turns it off */
  onToggle: () => void;
  /** Edits the visualisation, when the source has only one */
  onEdit?: () => void;
  isInInspector: boolean;
  onToggleInspector: () => void;
  onEditInspector: () => void;
  onAddColumn: () => void;
  onRemove: () => void;
  children?: ReactNode;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  // A marker layer's data wears that layer's ring
  const markerColor = useMarkerLayerColor(dataSourceId);
  const name = dataSourceId
    ? (dataSource?.name ?? "Data source")
    : "Choosing data…";

  return (
    // The source colouring the map is one card around its header and
    // columns, marked as live
    <li
      className={cn(
        "group/sourcegroup rounded-lg transition-colors",
        hasActive &&
          "border border-neutral-300 bg-white p-0.5 pb-1 shadow-[0_1px_3px_rgba(21,33,59,0.08),0_0_0_3px_rgba(21,33,59,0.04)]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg pr-1 transition-colors",
          !hasActive && "hover:bg-neutral-50",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={hasActive}
          title={hasActive ? "Turn off" : "Show on the map"}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1.5 py-1 text-left"
        >
          <span
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5",
              !hasActive && "opacity-60",
            )}
            title={
              markerColor
                ? "Marker layer"
                : dataSource
                  ? DataSourceTypeLabels[dataSource.config.type]
                  : undefined
            }
          >
            {markerColor ? (
              <RingSwatch color={markerColor} />
            ) : (
              <DataSourceIcon type={dataSource?.config?.type ?? "unknown"} />
            )}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate",
                hasActive ? "font-medium text-neutral-900" : "text-neutral-700",
              )}
              title={name}
            >
              {name}
            </span>
            {subtitle && (
              <span className="block truncate text-xs text-neutral-500">
                {subtitle}
              </span>
            )}
          </span>
          {hasActive && <OnMapBadge className="ml-auto" />}
        </button>
        {!isInInspector && (
          <span
            title="Hidden from the inspector"
            className="shrink-0 p-1 text-neutral-400"
          >
            <EyeOffIcon className="size-3.5" />
          </span>
        )}
        {dataSourceId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${name} options`}
                className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <EllipsisIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <SlidersHorizontalIcon className="size-3.5" />
                  Edit visualisation
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onAddColumn}>
                <PlusIcon className="size-3.5" />
                Add a column
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleInspector}>
                {isInInspector ? (
                  <EyeOffIcon className="size-3.5" />
                ) : (
                  <EyeIcon className="size-3.5" />
                )}
                {isInInspector ? "Hide from inspector" : "Show in inspector"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditInspector}>
                <PanelRightIcon className="size-3.5" />
                Inspector columns…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                <TrashIcon className="size-3.5" />
                Remove data source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {children}
    </li>
  );
}
