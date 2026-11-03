"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ColumnsIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  RotateCcwIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { useInspectorLayers } from "../../hooks/useInspectorLayers";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { useAddAreaData } from "../hooks/useAddAreaData";
import {
  useInspectorCustomising,
  useInspectorEditingDataSourceId,
  useOpenInspectorSectionEditor,
} from "../hooks/useInspectorCustomise";
import { useReorderInspectorSource } from "../hooks/useReorderInspectorSource";

// Replaces "Manage inspector data": the inspector follows the Areas list,
// and Customise turns this footer into the editor for its sections while
// the sections above keep showing real values
export default function LightInspectorFooter() {
  const [isCustomising, setIsCustomising] = useInspectorCustomising();
  const [editingId, setEditingId] = useInspectorEditingDataSourceId();
  const openSectionEditor = useOpenInspectorSectionEditor();
  const {
    sections: allSections,
    isCustomised,
    setHidden,
    reset,
  } = useInspectorLayers();
  // Same list as the Areas list: removing a section removes the data there
  const { items, removeSource } = useSavedVisualisations();
  const sections = allSections.filter((section) =>
    items.some((item) => item.areaDataSourceId === section.config.dataSourceId),
  );
  const reorderSource = useReorderInspectorSource();
  // Arrows swap with the neighbouring section, the same move as dragging
  // its tab, so Areas data reorders the Areas list too
  const move = (dataSourceId: string, direction: -1 | 1) => {
    const index = sections.findIndex(
      (s) => s.config.dataSourceId === dataSourceId,
    );
    const neighbour = sections[index + direction];
    if (neighbour) reorderSource(dataSourceId, neighbour.config.dataSourceId);
  };
  const addAreaData = useAddAreaData();

  if (!isCustomising) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
        <span>{isCustomised ? "Customised" : "Following your Areas list"}</span>
        <button
          type="button"
          onClick={() => setIsCustomising(true)}
          className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Settings2Icon className="size-3.5" />
          Customise
        </button>
      </div>
    );
  }

  const finish = () => {
    setIsCustomising(false);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
          Inspector sections
        </p>
        {isCustomised && (
          <button
            type="button"
            onClick={reset}
            title="Follow the Areas list again"
            className="flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[11px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <RotateCcwIcon className="size-3" />
            Reset to layers
          </button>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Add data to the Areas list to show it for any area you click.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {sections.map(({ config, dataSource, isHidden }, index) => (
            <li
              key={config.id}
              className={cn(
                "group/section flex items-center gap-1 rounded-md bg-white px-1.5 py-1 shadow-[inset_0_0_0_1px_#e5e5e5]",
                editingId === config.dataSourceId && "ring-2 ring-neutral-300",
              )}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(config.dataSourceId, -1)}
                  aria-label="Move up"
                  className="cursor-pointer rounded text-neutral-400 hover:text-neutral-900 disabled:cursor-default disabled:opacity-30"
                >
                  <ArrowUpIcon className="size-3" />
                </button>
                <button
                  type="button"
                  disabled={index === sections.length - 1}
                  onClick={() => move(config.dataSourceId, 1)}
                  aria-label="Move down"
                  className="cursor-pointer rounded text-neutral-400 hover:text-neutral-900 disabled:cursor-default disabled:opacity-30"
                >
                  <ArrowDownIcon className="size-3" />
                </button>
              </div>
              <span
                className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5",
                  isHidden && "opacity-40",
                )}
              >
                <DataSourceIcon type={dataSource?.config.type ?? "unknown"} />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-xs",
                  isHidden && "text-neutral-400",
                )}
              >
                {config.name?.trim() || dataSource?.name || "Data source"}
              </span>
              <button
                type="button"
                onClick={() => openSectionEditor(config.dataSourceId)}
                aria-label="Edit columns"
                title="Edit columns"
                className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <ColumnsIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setHidden(config.dataSourceId, !isHidden)}
                aria-pressed={!isHidden}
                aria-label={isHidden ? "Show section" : "Hide section"}
                title={isHidden ? "Show" : "Hide"}
                className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {isHidden ? (
                  <EyeOffIcon className="size-3.5" />
                ) : (
                  <EyeIcon className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removeSource(config.dataSourceId)}
                aria-label="Remove from Areas"
                title="Remove from Areas and the inspector"
                className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => addAreaData()}
        className="-ml-0.5 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <PlusIcon className="size-3.5" />
        Add data
      </button>

      <Button size="sm" className="h-7 text-xs" onClick={finish}>
        Done
      </Button>
    </div>
  );
}
