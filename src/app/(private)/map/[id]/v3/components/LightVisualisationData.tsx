"use client";

import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useDataSources } from "@/hooks/useDataSources";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import Legend from "../../components/Legend/Legend";
import RingSwatch from "../../components/RingSwatch";
import { useMapViews } from "../../hooks/useMapViews";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { useAddAreaData } from "../hooks/useAddAreaData";
import { useTourFocusedDataSourceId } from "../hooks/useTour";
import LightDataSourceList from "./LightDataSourceList";
import { getColumnLabel } from "./LightVisualisationRow";

// The top of the visualisation flyout, laid out like the source's Areas
// group: the data source, then its columns as a tree. Selecting a column
// puts it on the map and shows its settings below (column, aggregation,
// style). The colour key stays in the sidebar.
export default function LightVisualisationData() {
  const { viewConfig } = useMapViews();
  const { items, activeId, select, chooseDataSource, remove } =
    useSavedVisualisations();
  const addAreaData = useAddAreaData();
  const { getDataSourceById } = useDataSources();
  const [isPickingSource, setIsPickingSource] = useState(false);
  const tourFocusedId = useTourFocusedDataSourceId("areas");
  const dataSourceId = viewConfig.areaDataSourceId;
  const dataSource = getDataSourceById(dataSourceId);
  const markerColor = useMarkerLayerColor(dataSourceId);

  if (!dataSourceId) {
    return (
      <LightDataSourceList
        onSelect={(ds) => chooseDataSource(ds.id)}
        focusedId={tourFocusedId}
      />
    );
  }

  const columns = items.filter(
    (item) => item.areaDataSourceId === dataSourceId,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {/* The source; click to switch this visualisation to another */}
        <Popover open={isPickingSource} onOpenChange={setIsPickingSource}>
          <PopoverTrigger
            title="Change data source"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-neutral-100"
          >
            <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
              {markerColor ? (
                <RingSwatch color={markerColor} />
              ) : (
                <DataSourceIcon type={dataSource?.config.type ?? "unknown"} />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {dataSource?.name ?? "Data source"}
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-neutral-400" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-96 w-72 overflow-y-auto p-3"
          >
            <LightDataSourceList
              onSelect={(ds) => {
                chooseDataSource(ds.id);
                setIsPickingSource(false);
              }}
              isSelected={(ds) => ds.id === dataSourceId}
            />
          </PopoverContent>
        </Popover>

        {/* Its columns, as in the Areas list; the selected one is on the map */}
        <ul className="flex flex-col">
          {columns.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id} className="group/row relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-1.5 left-3 h-[1.125rem] w-3 rounded-bl-md border-b border-l border-neutral-300"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0 -bottom-0.5 left-3 border-l border-neutral-300"
                />
                <button
                  type="button"
                  onClick={() => select(item.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md py-1 pr-7 pl-[1.625rem] text-left",
                    isActive
                      ? "bg-white shadow-[inset_0_0_0_1px_#e5e5e5]"
                      : "hover:bg-neutral-100",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      isActive ? "bg-neutral-900" : "bg-neutral-300",
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 truncate text-xs",
                      isActive
                        ? "font-medium text-neutral-900"
                        : "text-neutral-600",
                    )}
                  >
                    {getColumnLabel(item)}
                  </span>
                </button>
                {/* Remove from the list (and from the Areas group) */}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  title="Remove column"
                  aria-label={`Remove ${getColumnLabel(item)}`}
                  className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-red-600"
                >
                  <TrashIcon className="size-3" />
                </button>
              </li>
            );
          })}
          <li className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1.5 left-3 h-[1.125rem] w-3 rounded-bl-md border-b border-l border-neutral-300"
            />
            <button
              type="button"
              onClick={() => addAreaData(dataSourceId)}
              data-tour="add-column"
              className="flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-1.5 pl-[1.5rem] text-left text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <PlusIcon className="size-3" />
              Add a column
            </button>
          </li>
        </ul>
      </div>

      {/* The selected column's settings */}
      <Legend
        showLegendBars={false}
        showBoundaryControls={false}
        framed={false}
        showColumnSettings={false}
        showSourcePicker={false}
      />
    </div>
  );
}
