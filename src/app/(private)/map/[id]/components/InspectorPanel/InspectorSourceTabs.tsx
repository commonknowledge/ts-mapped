"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDownIcon, Settings2Icon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { useInspectorActiveSource } from "../../hooks/useInspectorActiveSource";
import { useInspectorLayers } from "../../hooks/useInspectorLayers";
import { useMapEditable } from "../../hooks/useMapEditable";
import { useMapViews } from "../../hooks/useMapViews";
import {
  InspectorExtraTabsContext,
  useInspectorVariant,
} from "./InspectorVariantContext";
import { LocationDataPanel } from "./LocationDataPanel";
import VisualisationSourceIcon from "./VisualisationSourceIcon";
import type { SelectedBoundary } from "../../types/inspector";
import type { Point } from "@/models/shared";
import type { DragEndEvent } from "@dnd-kit/core";

// With more tabs than this, a menu lists every source by its full name
const MENU_THRESHOLD = 3;

// The light editor's location data: one tab per data source, instead of a
// stack of sections to scroll through. The chosen tab is remembered as you
// click between areas; until you choose, the visualised source leads.
export default function InspectorSourceTabs({
  configs,
  selectedBoundary,
  markerPoint,
}: {
  configs: { id: string; dataSourceId: string; name?: string | null }[];
  selectedBoundary?: SelectedBoundary | null;
  markerPoint?: Point | null;
}) {
  const [activeId, setActiveId] = useInspectorActiveSource();
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { onConfigureSource, renderAddSource, onReorderSource } =
    useInspectorVariant();
  const editable = useMapEditable();
  const extraTabs = useContext(InspectorExtraTabsContext);
  const { moveTo } = useInspectorLayers();
  // A short drag threshold keeps a click a click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const canAdd = editable && Boolean(renderAddSource);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      (onReorderSource ?? moveTo)(String(active.id), String(over.id));
    }
  };

  const visualisedId = viewConfig.areaDataSourceId;
  const ids = configs.map((c) => c.dataSourceId);
  const selectedId =
    activeId &&
    (ids.includes(activeId) || extraTabs.some((t) => t.id === activeId))
      ? activeId
      : visualisedId && ids.includes(visualisedId)
        ? visualisedId
        : (ids[0] ?? extraTabs[0]?.id);
  const selectedExtra = extraTabs.find((t) => t.id === selectedId);

  // Long rows scroll sideways; keep the chosen tab in view
  useEffect(() => {
    const tabs =
      scrollRef.current?.querySelectorAll<HTMLElement>("[data-tab-id]");
    Array.from(tabs ?? [])
      .find((tab) => tab.dataset.tabId === selectedId)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  if (configs.length === 0 && extraTabs.length === 0 && !canAdd) return null;

  const labelFor = (config: (typeof configs)[number]) =>
    config.name?.trim() ||
    getDataSourceById(config.dataSourceId)?.name ||
    "Data";

  const selectedConfig = configs.find((c) => c.dataSourceId === selectedId);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end gap-1 border-b border-neutral-200">
        {/* Scrolls sideways when the tabs don't fit; its bottom overlaps the
            row's border so the selected tab's underline sits on it */}
        <div
          ref={scrollRef}
          role="tablist"
          className="-mb-px flex min-w-0 flex-1 items-end overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={configs.map((c) => c.dataSourceId)}
              strategy={horizontalListSortingStrategy}
            >
              {configs.map((config) => (
                <SourceTab
                  key={config.id}
                  dataSourceId={config.dataSourceId}
                  label={labelFor(config)}
                  isSelected={config.dataSourceId === selectedId}
                  isVisualised={config.dataSourceId === visualisedId}
                  isDraggable={editable && configs.length > 1}
                  onSelect={() => setActiveId(config.dataSourceId)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        {configs.length > MENU_THRESHOLD && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="All data sources"
              title="All data sources"
              className="mb-1 flex shrink-0 cursor-pointer items-center rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-w-64">
              {configs.map((config) => (
                <DropdownMenuItem
                  key={config.id}
                  onClick={() => setActiveId(config.dataSourceId)}
                  className={cn(
                    "text-xs",
                    config.dataSourceId === selectedId && "font-medium",
                  )}
                >
                  <span className="truncate">{labelFor(config)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {canAdd && renderAddSource?.({ withLabel: configs.length === 0 })}
        {extraTabs.length > 0 && (configs.length > 0 || canAdd) && (
          <span
            className="mx-1 mb-2 h-3.5 w-px shrink-0 self-end bg-neutral-200"
            aria-hidden
          />
        )}
        {extraTabs.map((tab) => {
          const isSelected = tab.id === selectedId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "-mb-px flex shrink-0 cursor-pointer items-center rounded-t border-b-2 px-2 py-1.5 text-xs whitespace-nowrap outline-none focus-visible:bg-neutral-100",
                isSelected
                  ? "border-neutral-900 font-medium text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900",
              )}
            >
              {tab.label}
              {/* Styled like the counts on folder rows */}
              {typeof tab.count === "number" && (
                <span className="ml-1.5 font-normal text-neutral-400 tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        {editable && onConfigureSource && selectedConfig && (
          <button
            type="button"
            onClick={() => selectedId && onConfigureSource(selectedId)}
            aria-label="Choose what this source shows"
            title="Choose what this source shows"
            className="mb-1 shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Settings2Icon className="size-3.5" />
          </button>
        )}
      </div>
      {selectedExtra
        ? selectedExtra.content
        : selectedConfig && (
            <LocationDataPanel
              key={selectedConfig.id}
              dataSourceId={selectedConfig.dataSourceId}
              selectedBoundary={selectedBoundary}
              markerPoint={markerPoint}
              defaultExpanded
            />
          )}
    </section>
  );
}

function SourceTab({
  dataSourceId,
  label,
  isSelected,
  isVisualised,
  isDraggable,
  onSelect,
}: {
  dataSourceId: string;
  label: string;
  isSelected: boolean;
  isVisualised: boolean;
  isDraggable: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dataSourceId, disabled: !isDraggable });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // After the sortable attributes, which would make these plain buttons
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-tab-id={dataSourceId}
      aria-roledescription={isDraggable ? "draggable tab" : undefined}
      onClick={onSelect}
      title={isDraggable ? `${label} (drag to reorder)` : label}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex max-w-[10rem] shrink-0 cursor-pointer items-center gap-1 rounded-t border-b-2 px-2 py-1.5 text-xs whitespace-nowrap outline-none focus-visible:bg-neutral-100",
        isSelected
          ? "border-neutral-900 font-medium text-neutral-900"
          : "border-transparent text-neutral-500 hover:text-neutral-900",
        isDragging && "relative z-10 cursor-grabbing bg-white shadow-sm",
      )}
    >
      {isVisualised && (
        <span title="Coloured on the map" className="flex">
          <VisualisationSourceIcon dataSourceId={dataSourceId} />
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
