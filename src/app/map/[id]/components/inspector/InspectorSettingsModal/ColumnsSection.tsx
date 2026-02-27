"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import type {
  InspectorBoundaryConfig,
  InspectorColumnItem,
} from "@/server/models/MapView";
import { Label } from "@/shadcn/ui/label";
import { inferFormat } from "./constants";
import { AvailableListWithDividers } from "./AvailableListWithDividers";
import {
  AvailableDragPreview,
  ColumnDragPreview,
  DividerDragPreview,
} from "./DragPreviews";
import { DroppableSelectedColumns } from "./DroppableSelectedColumns";
import type { DragEndEvent } from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import {
  AVAILABLE_DROPPABLE_ID,
  SELECTED_DROPPABLE_ID,
} from "./constants";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return typeof item === "object" && item !== null && item.type === "divider";
}

export function ColumnsSection({
  config,
  allColumnsInOrder,
  selectedColumnsInOrder,
  selectedItemsInOrder,
  allItemsInOrder,
  availableColumns,
  availableIds,
  columnIds,
  columns,
  columnMetadata,
  updateConfig,
  handleAddColumn,
  handleRemoveColumn,
  handleRemoveColumnFromRight,
}: {
  config: InspectorBoundaryConfig;
  allColumnsInOrder: string[];
  selectedColumnsInOrder: string[];
  selectedItemsInOrder: InspectorColumnItem[];
  allItemsInOrder: InspectorColumnItem[];
  availableColumns: string[];
  availableIds: string[];
  columnIds: string[];
  columns: string[];
  columnMetadata: Record<string, { displayName?: string }>;
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
  handleAddColumn: (colName: string) => void;
  handleRemoveColumn: (colName: string) => void;
  handleRemoveColumnFromRight: (colName: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const isAvailableItem = (s: string) =>
    s.startsWith("available-") || s.startsWith("divider-");

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      const activeStr = String(active.id);
      const overStr = over ? String(over.id) : null;

      if (isAvailableItem(activeStr) && overStr) {
        const oldIndex = availableIds.indexOf(activeStr);
        if (oldIndex === -1) return;
        const newIndex =
          overStr === AVAILABLE_DROPPABLE_ID
            ? availableIds.length
            : availableIds.indexOf(overStr);
        if (!isAvailableItem(overStr) && overStr !== AVAILABLE_DROPPABLE_ID)
          return;
        if (newIndex === -1 && overStr !== AVAILABLE_DROPPABLE_ID) return;
        const next = [...allItemsInOrder];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        const nextColumnOrder = next
          .filter((i): i is string => typeof i === "string")
          .filter((c) => allColumnsInOrder.includes(c));
        const nextColumnItems = next.filter(
          (i) =>
            (typeof i === "string" && allColumnsInOrder.includes(i)) ||
            isDivider(i),
        );
        updateConfig((prev) => ({
          ...prev,
          columnOrder: nextColumnOrder,
          columnItems: nextColumnItems.some((i) => isDivider(i))
            ? nextColumnItems
            : prev.columnItems,
        }));
        return;
      }

      const isSelectedItem = (s: string) => s.startsWith("col-");
      if (isSelectedItem(activeStr) && overStr) {
        const oldIndex = columnIds.indexOf(activeStr);
        if (oldIndex === -1) return;
        const newIndex =
          overStr === SELECTED_DROPPABLE_ID
            ? columnIds.length
            : columnIds.indexOf(overStr);
        if (!isSelectedItem(overStr) && overStr !== SELECTED_DROPPABLE_ID)
          return;
        if (newIndex === -1 && overStr !== SELECTED_DROPPABLE_ID) return;
        const next = [...selectedColumnsInOrder];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        const newColumnOrder = [
          ...next,
          ...allColumnsInOrder.filter((c) => !next.includes(c)),
        ];
        updateConfig((prev) => {
          const base = {
            ...prev,
            columns: next,
            columnOrder: newColumnOrder,
          };
          if (prev.columnItems?.length && prev.columnItems.some(isDivider)) {
            let colIdx = 0;
            base.columnItems = prev.columnItems.map((i) =>
              isDivider(i) ? i : next[colIdx++],
            );
          }
          return base;
        });
        return;
      }
    },
    [
      columnIds,
      availableIds,
      updateConfig,
      allColumnsInOrder,
      allItemsInOrder,
      selectedColumnsInOrder,
    ],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-muted-foreground">Columns</Label>
          <p className="text-xs text-muted-foreground">
            Tick columns in Available to add. Reorder in Columns to show with
            the handle.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              updateConfig((prev) => {
                const nextColumns = [
                  ...(prev.columns ?? []),
                  ...availableColumns,
                ];
                const nextMeta = { ...prev.columnMetadata };
                availableColumns.forEach((col) => {
                  const inferred = inferFormat(col);
                  if (inferred && nextMeta[col]?.format == null) {
                    nextMeta[col] = { ...nextMeta[col], format: inferred };
                  } else if (inferred && !nextMeta[col]) {
                    nextMeta[col] = { format: inferred };
                  }
                });
                const nextColumnItems = prev.columnItems?.length
                  ? [...prev.columnItems, ...availableColumns]
                  : undefined;
                return {
                  ...prev,
                  columns: nextColumns,
                  columnOrder: nextColumns,
                  ...(nextColumnItems && { columnItems: nextColumnItems }),
                  columnMetadata: nextMeta,
                };
              })
            }
            disabled={availableColumns.length === 0}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Add all
          </button>
          <button
            type="button"
            onClick={() =>
              updateConfig((prev) => ({
                ...prev,
                columns: [],
                columnItems: prev.columnItems?.filter(isDivider) ?? prev.columnItems,
              }))
            }
            disabled={columns.length === 0}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Remove all
          </button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Available (tick to add, drag to reorder, add dividers)
            </p>
            <AvailableListWithDividers
              allItemsInOrder={allItemsInOrder}
              selectedColumns={columns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onAddDivider={() =>
                updateConfig((prev) => {
                  const items = prev.columnItems ?? prev.columns.map((c) => c);
                  const newDivider = {
                    type: "divider" as const,
                    id: uuidv4(),
                    label: "New section",
                  };
                  return {
                    ...prev,
                    columnItems: [...items, newDivider],
                  };
                })
              }
              onDividerLabelChange={(id, label) =>
                updateConfig((prev) => ({
                  ...prev,
                  columnItems: (prev.columnItems ?? []).map((i) =>
                    isDivider(i) && i.id === id ? { ...i, label } : i,
                  ),
                }))
              }
              onRemoveDivider={(id) =>
                updateConfig((prev) => ({
                  ...prev,
                  columnItems: (prev.columnItems ?? []).filter(
                    (i) => !(isDivider(i) && i.id === id),
                  ),
                }))
              }
              availableIds={availableIds}
              activeId={activeId}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Columns to show
            </p>
            <DroppableSelectedColumns
              columns={selectedColumnsInOrder}
              columnMetadata={columnMetadata}
              updateConfig={updateConfig}
              onRemoveColumn={handleRemoveColumnFromRight}
              activeId={activeId}
            />
          </div>
        </div>
        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay
              dropAnimation={{ duration: 200, easing: "ease" }}
              modifiers={[
                ({ transform }) => ({
                  ...transform,
                  x: transform.x,
                  y: transform.y,
                }),
              ]}
            >
              {activeId && String(activeId).startsWith("col-") ? (
                <ColumnDragPreview
                  activeId={String(activeId)}
                  columnMetadata={columnMetadata}
                />
              ) : activeId && String(activeId).startsWith("divider-") ? (
                <DividerDragPreview
                  activeId={String(activeId)}
                  label={
                    (() => {
                      const item = allItemsInOrder.find(
                        (i) =>
                          isDivider(i) && `divider-${i.id}` === String(activeId),
                      );
                      return (item && isDivider(item) ? item.label : "Label divider") ?? "Label divider";
                    })()
                  }
                />
              ) : activeId && String(activeId).startsWith("available-") ? (
                <AvailableDragPreview activeId={String(activeId)} />
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </div>
  );
}
