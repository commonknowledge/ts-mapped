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
import { useCallback } from "react";
import { cn } from "@/shadcn/utils";
import type { DragEndEvent } from "@dnd-kit/core";

export function ColumnOrderList({
  selectedColumns,
  getLabel,
  dataSourceId,
  onReorderColumns,
}: {
  selectedColumns: string[];
  getLabel: (colName: string) => string;
  dataSourceId: string;
  onReorderColumns: (
    dataSourceId: string,
    orderedColumnNames: string[],
  ) => void;
}) {
  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const columnIds = selectedColumns.map((_, i) => `col-${i}`);
      const oldIndex = columnIds.indexOf(active.id as string);
      const newIndex = columnIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = [...selectedColumns];
      const [removed] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, removed);
      onReorderColumns(dataSourceId, next);
    },
    [selectedColumns, dataSourceId, onReorderColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (selectedColumns.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Tick columns in the list to add them, then reorder here.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleColumnDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={selectedColumns.map((_, i) => `col-${i}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1.5">
          {selectedColumns.map((col, i) => (
            <SortableColumnChip
              key={`${col}-${i}`}
              id={`col-${i}`}
              label={getLabel(col)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableColumnChip({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border border-neutral-200 bg-white pl-1.5 pr-2 py-1.5 text-xs shadow-sm",
        isDragging && "opacity-60 z-10 ring-1 ring-primary",
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder column"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="truncate flex-1 min-w-0" title={label}>
        {label}
      </span>
    </div>
  );
}
