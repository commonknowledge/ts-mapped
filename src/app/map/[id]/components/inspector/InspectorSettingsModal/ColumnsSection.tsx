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
import { useCallback, useMemo, useState } from "react";
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
  SELECTED_DROPPABLE_ID,
  SELECTED_LEFT_DROPPABLE_ID,
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
  availableColumns,
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
  availableColumns: string[];
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

  const selectedSectionIds = useMemo(
    () =>
      selectedItemsInOrder.map((item, i) =>
        typeof item === "string"
          ? `left-selected-${i}-${item}`
          : `divider-${item.id}`,
      ),
    [selectedItemsInOrder],
  );

  const isLeftSelectedItem = (s: string) =>
    s.startsWith("left-selected-") || s.startsWith("divider-");

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      const activeStr = String(active.id);
      const overStr = over ? String(over.id) : null;

      if (isLeftSelectedItem(activeStr) && overStr) {
        const oldIndex = selectedSectionIds.indexOf(activeStr);
        if (oldIndex === -1) return;
        const newIndex =
          overStr === SELECTED_LEFT_DROPPABLE_ID
            ? selectedSectionIds.length
            : selectedSectionIds.indexOf(overStr);
        if (
          !isLeftSelectedItem(overStr) &&
          overStr !== SELECTED_LEFT_DROPPABLE_ID
        )
          return;
        if (newIndex === -1 && overStr !== SELECTED_LEFT_DROPPABLE_ID) return;
        const next = [...selectedItemsInOrder];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        const nextColumnOrder = [
          ...next.filter((i): i is string => typeof i === "string"),
          ...availableColumns,
        ];
        const nextColumnItems = next.some((i) => isDivider(i)) ? next : undefined;
        updateConfig((prev) => ({
          ...prev,
          columnOrder: nextColumnOrder,
          ...(nextColumnItems !== undefined && {
            columnItems: nextColumnItems,
          }),
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
      selectedSectionIds,
      selectedItemsInOrder,
      availableColumns,
      updateConfig,
      allColumnsInOrder,
      selectedColumnsInOrder,
      columns,
    ],
  );

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <div className="flex items-start justify-between gap-4 shrink-0">
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
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 items-stretch">
          {/* Available columns */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground shrink-0">
              Available columns
            </p>
            <AvailableListWithDividers
              selectedItemsInOrder={selectedItemsInOrder}
              selectedSectionIds={selectedSectionIds}
              availableColumns={availableColumns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onAddDivider={() =>
                updateConfig((prev) => {
                  const items = prev.columnItems ?? prev.columns.map((c) => c);
                  const newDivider = {
                    type: "divider" as const,
                    id: uuidv4(),
                    label: "",
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
              activeId={activeId}
              mode="available"
            />
          </div>

          {/* Selected columns */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground shrink-0">
              Selected columns
            </p>
            <AvailableListWithDividers
              selectedItemsInOrder={selectedItemsInOrder}
              selectedSectionIds={selectedSectionIds}
              availableColumns={availableColumns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onAddDivider={() =>
                updateConfig((prev) => {
                  const items = prev.columnItems ?? prev.columns.map((c) => c);
                  const newDivider = {
                    type: "divider" as const,
                    id: uuidv4(),
                    label: "",
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
              activeId={activeId}
              mode="selected"
            />
          </div>

          {/* Selected column settings */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground shrink-0">
              Selected column settings
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
                      const item = selectedItemsInOrder.find(
                        (i) =>
                          isDivider(i) && `divider-${i.id}` === String(activeId),
                      );
                      return (item && isDivider(item) ? item.label : "Section label") ?? "Section label";
                    })()
                  }
                />
              ) : activeId &&
                (String(activeId).startsWith("available-") ||
                  String(activeId).startsWith("left-selected-")) ? (
                <AvailableDragPreview activeId={String(activeId)} />
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </div>
  );
}
