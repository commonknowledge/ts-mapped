"use client";

import {
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  PanelRightIcon,
  PlusIcon,
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
import RingSwatch from "../../components/RingSwatch";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import type { ReactNode } from "react";

// A data source in the Areas list, with the columns saved from it underneath.
// One group is one inspector tab, in the same order.
export default function LightAreaSourceGroup({
  dataSourceId,
  hasActive,
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
  isInInspector: boolean;
  onToggleInspector: () => void;
  onEditInspector: () => void;
  onAddColumn: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  // A marker layer's data wears that layer's ring
  const markerColor = useMarkerLayerColor(dataSourceId);
  const name = dataSourceId
    ? (dataSource?.name ?? "Data source")
    : "Choosing data…";

  return (
    <li className="group/sourcegroup">
      <div className="group/source flex items-center gap-1 rounded-lg pr-1">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1">
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
          <span
            className={cn(
              "min-w-0 truncate",
              hasActive ? "font-medium text-neutral-900" : "text-neutral-700",
            )}
            title={name}
          >
            {name}
          </span>
        </div>
        {dataSourceId && (
          <>
            <button
              type="button"
              onClick={onToggleInspector}
              aria-pressed={isInInspector}
              aria-label={
                isInInspector ? "Hide from inspector" : "Show in inspector"
              }
              title={
                isInInspector
                  ? "Shown as an inspector tab. Click to hide"
                  : "Hidden from the inspector. Click to show"
              }
              className={cn(
                "cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:opacity-100",
                isInInspector && "opacity-0 group-hover/source:opacity-100",
              )}
            >
              {isInInspector ? (
                <EyeIcon className="size-3.5" />
              ) : (
                <EyeOffIcon className="size-3.5" />
              )}
            </button>
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
                <DropdownMenuItem onClick={onAddColumn}>
                  <PlusIcon className="size-3.5" />
                  Add a column
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
          </>
        )}
      </div>
      <ul className="flex flex-col gap-0.5">{children}</ul>
      {dataSourceId && (
        <button
          type="button"
          onClick={onAddColumn}
          className="mt-0.5 ml-[1.375rem] flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[11px] text-neutral-400 opacity-0 group-hover/sourcegroup:opacity-100 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:opacity-100"
        >
          <PlusIcon className="size-3" />
          Add column
        </button>
      )}
    </li>
  );
}
