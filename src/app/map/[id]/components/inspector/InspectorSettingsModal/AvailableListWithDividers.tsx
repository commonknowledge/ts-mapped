"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/shadcn/utils";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import type { InspectorColumnItem } from "@/server/models/MapView";
import { SortableAvailableRow } from "./SortableAvailableRow";
import { SortableDividerRow } from "./SortableDividerRow";
import { AVAILABLE_DROPPABLE_ID } from "./constants";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return typeof item === "object" && item !== null && item.type === "divider";
}

export function AvailableListWithDividers({
  allItemsInOrder,
  selectedColumns,
  onAddColumn,
  onRemoveColumn,
  onAddDivider,
  onDividerLabelChange,
  onRemoveDivider,
  availableIds,
  activeId,
}: {
  allItemsInOrder: InspectorColumnItem[];
  selectedColumns: string[];
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnName: string) => void;
  onAddDivider: () => void;
  onDividerLabelChange: (id: string, label: string) => void;
  onRemoveDivider: (id: string) => void;
  availableIds: string[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: AVAILABLE_DROPPABLE_ID });

  const { visibleWithIndex, nonVisibleWithIndex } = useMemo(() => {
    const visible: { item: InspectorColumnItem; index: number }[] = [];
    const nonVisible: { item: string; index: number }[] = [];
    allItemsInOrder.forEach((item, index) => {
      if (isDivider(item)) {
        visible.push({ item, index });
      } else if (selectedColumns.includes(item)) {
        visible.push({ item, index });
      } else {
        nonVisible.push({ item, index });
      }
    });
    return { visibleWithIndex: visible, nonVisibleWithIndex: nonVisible };
  }, [allItemsInOrder, selectedColumns]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border min-h-[360px] max-h-[520px] overflow-y-auto flex flex-col",
        isOver
          ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20 border-dashed"
          : "border-dashed border-neutral-200 bg-neutral-50/50",
      )}
    >
      <div className="p-2 shrink-0">
        <button
          type="button"
          onClick={onAddDivider}
          className="w-full rounded border border-dashed border-neutral-300 py-1.5 text-xs text-muted-foreground hover:border-neutral-400 hover:text-foreground transition-colors"
        >
          + Add label divider
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-1">
        <SortableContext items={availableIds} strategy={verticalListSortingStrategy}>
          {visibleWithIndex.map(({ item, index }) =>
            typeof item === "string" ? (
              <SortableAvailableRow
                key={availableIds[index]}
                id={availableIds[index]}
                columnName={item}
                selected={true}
                onToggle={() => onRemoveColumn(item)}
                isDragging={activeId === availableIds[index]}
              />
            ) : (
              <SortableDividerRow
                key={`divider-${item.id}`}
                id={`divider-${item.id}`}
                label={item.label}
                onLabelChange={(value) => onDividerLabelChange(item.id, value)}
                onRemove={() => onRemoveDivider(item.id)}
                isDragging={activeId === `divider-${item.id}`}
              />
            ),
          )}
          {nonVisibleWithIndex.length > 0 && (
            <>
              <div className="border-t-2 border-neutral-300 my-2" />
              {nonVisibleWithIndex.map(({ item: col, index }) => (
                <SortableAvailableRow
                  key={availableIds[index]}
                  id={availableIds[index]}
                  columnName={col}
                  selected={false}
                  onToggle={() => onAddColumn(col)}
                  isDragging={activeId === availableIds[index]}
                />
              ))}
            </>
          )}
        </SortableContext>
      </div>
      {allItemsInOrder.length === 0 && (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No columns in this data source
        </p>
      )}
    </div>
  );
}
