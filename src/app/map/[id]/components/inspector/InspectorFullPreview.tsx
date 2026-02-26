"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { cn } from "@/shadcn/utils";
import { BoundaryDataPanel } from "./BoundaryDataPanel";
import { getSelectedColumnsOrdered } from "./inspectorColumnOrder";
import InspectorOnMapSection from "./InspectorOnMapSection";
import type { DragEndEvent } from "@dnd-kit/core";

/**
 * Renders a full preview of the inspector Data tab for boundaries:
 * On the map section + Data in this area with all BoundaryDataPanels expanded.
 * Panels can be reordered by dragging; order is synced to the list.
 * When selectedDataSourceId is set, the preview scrolls so that panel is visible.
 */
export function InspectorFullPreview({
  className,
  selectedDataSourceId,
}: {
  className?: string;
  selectedDataSourceId?: string | null;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { selectedBoundary } = useInspector();
  const { view, getLatestView, updateView } = useMapViews();
  const boundaryConfigs = view?.inspectorConfig?.boundaries ?? [];

  useEffect(() => {
    if (!selectedDataSourceId) return;
    const escaped = selectedDataSourceId
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    const el = scrollContainerRef.current?.querySelector(
      `[data-data-source-id="${escaped}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDataSourceId]);

  const boundaryData = useMemo(
    () =>
      boundaryConfigs.map((config) => ({
        config,
        dataSourceId: config.dataSourceId,
        areaCode: selectedBoundary?.areaCode ?? "",
        columns: getSelectedColumnsOrdered(config),
      })),
    [boundaryConfigs, selectedBoundary?.areaCode],
  );

  const reorderBoundaries = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;
      const latestView = getLatestView();
      if (!latestView) return;
      const boundaries = latestView.inspectorConfig?.boundaries ?? [];
      const next = [...boundaries];
      const [removed] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, removed);
      updateView({
        ...latestView,
        inspectorConfig: {
          ...latestView.inspectorConfig,
          boundaries: next,
        },
      });
    },
    [getLatestView, updateView],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = boundaryConfigs.map((c) => c.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      reorderBoundaries(oldIndex, newIndex);
    },
    [boundaryConfigs, reorderBoundaries],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-lg border border-neutral-200 bg-white shadow-sm text-sm overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-neutral-200">
        <p className="text-xs font-semibold text-muted-foreground">Preview</p>
        <p className="text-sm font-medium truncate">
          {selectedBoundary?.name ?? "Boundary"}
        </p>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-4"
      >
        <InspectorOnMapSection />
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Data in this area — drag to reorder
          </p>
          {boundaryConfigs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No data sources added yet
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={boundaryConfigs.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {boundaryData.map((item) => (
                    <SortableBoundaryPanel key={item.config.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>
    </div>
  );
}

function SortableBoundaryPanel({
  item,
}: {
  item: {
    config: InspectorBoundaryConfig;
    dataSourceId: string;
    areaCode: string;
    columns: string[];
  };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.config.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-data-source-id={item.config.dataSourceId}
      className={cn("flex items-start gap-1", isDragging && "opacity-60 z-10")}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing mt-3 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-neutral-100 shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <BoundaryDataPanel
          config={item.config}
          dataSourceId={item.dataSourceId}
          areaCode={item.areaCode}
          columns={item.columns}
          columnMetadata={item.config.columnMetadata}
          columnGroups={item.config.columnGroups}
          layout={item.config.layout}
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}
