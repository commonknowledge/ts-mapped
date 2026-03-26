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
import { v4 as uuidv4 } from "uuid";
import { Label } from "@/shadcn/ui/label";
import { AvailableListWithDividers } from "./AvailableListWithDividers";
import { SELECTED_DROPPABLE_ID, SELECTED_LEFT_DROPPABLE_ID } from "./constants";
import {
  AvailableDragPreview,
  ColumnDragPreview,
  DividerDragPreview,
} from "./DragPreviews";
import { DroppableSelectedColumns } from "./DroppableSelectedColumns";
import type {
  InspectorColumnItem,
  InspectorDataSourceConfig,
} from "@/models/MapView";
import type { DragEndEvent } from "@dnd-kit/core";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return item.type === "divider";
}

function isColumn(
  item: InspectorColumnItem,
): item is Extract<InspectorColumnItem, { type: "column" }> {
  return item.type === "column";
}

export function ColumnsSection({
  selectedColumnsInOrder,
  selectedItemsInOrder,
  availableColumns,
  columnIds,
  updateConfig,
  handleAddColumn,
  handleRemoveColumn,
  handleRemoveColumnFromRight,
}: {
  config: InspectorDataSourceConfig;
  selectedColumnsInOrder: string[];
  selectedItemsInOrder: InspectorColumnItem[];
  availableColumns: string[];
  columnIds: string[];
  updateConfig: (
    updater: (prev: InspectorDataSourceConfig) => InspectorDataSourceConfig,
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
        isColumn(item)
          ? `left-selected-${i}-${item.name}`
          : `divider-${item.id}`,
      ),
    [selectedItemsInOrder],
  );

  const columnItems = useMemo(
    () => selectedItemsInOrder.filter(isColumn),
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
        updateConfig((prev) => ({
          ...prev,
          inspectorColumnItems: next,
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
        const nextColOrder = [...selectedColumnsInOrder];
        const [removed] = nextColOrder.splice(oldIndex, 1);
        nextColOrder.splice(newIndex, 0, removed);
        updateConfig((prev) => {
          const colItemsMap = new Map(
            (prev.inspectorColumnItems ?? [])
              .filter(isColumn)
              .map((ci) => [ci.name, ci]),
          );
          const newColItems = nextColOrder
            .map((name) => colItemsMap.get(name))
            .filter((c) => c !== undefined);
          let colIdx = 0;
          return {
            ...prev,
            inspectorColumnItems: (prev.inspectorColumnItems ?? []).map(
              (item) => (isColumn(item) ? newColItems[colIdx++] : item),
            ),
          };
        });
        return;
      }
    },
    [
      columnIds,
      selectedSectionIds,
      selectedItemsInOrder,
      updateConfig,
      selectedColumnsInOrder,
    ],
  );

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <Label className="text-muted-foreground">Columns</Label>
          <p className="text-xs text-muted-foreground">
            Tick columns in Available to add. Reorder with the handle.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              updateConfig((prev) => ({
                ...prev,
                inspectorColumnItems: [
                  ...(prev.inspectorColumnItems ?? []),
                  ...availableColumns.map(
                    (n): InspectorColumnItem => ({ type: "column", name: n }),
                  ),
                ],
              }))
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
                inspectorColumnItems: (prev.inspectorColumnItems ?? []).filter(
                  isDivider,
                ),
              }))
            }
            disabled={selectedColumnsInOrder.length === 0}
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
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: [
                    ...(prev.inspectorColumnItems ?? []),
                    { type: "divider" as const, id: uuidv4(), label: "" },
                  ],
                }))
              }
              onDividerLabelChange={(id, label) =>
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: (prev.inspectorColumnItems ?? []).map(
                    (i) => (isDivider(i) && i.id === id ? { ...i, label } : i),
                  ),
                }))
              }
              onRemoveDivider={(id) =>
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: (
                    prev.inspectorColumnItems ?? []
                  ).filter((i) => !(isDivider(i) && i.id === id)),
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
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: [
                    ...(prev.inspectorColumnItems ?? []),
                    { type: "divider" as const, id: uuidv4(), label: "" },
                  ],
                }))
              }
              onDividerLabelChange={(id, label) =>
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: (prev.inspectorColumnItems ?? []).map(
                    (i) => (isDivider(i) && i.id === id ? { ...i, label } : i),
                  ),
                }))
              }
              onRemoveDivider={(id) =>
                updateConfig((prev) => ({
                  ...prev,
                  inspectorColumnItems: (
                    prev.inspectorColumnItems ?? []
                  ).filter((i) => !(isDivider(i) && i.id === id)),
                }))
              }
              activeId={activeId}
              mode="selected"
            />
          </div>

          {/* Selected column settings */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground shrink-0">
              Column settings
            </p>
            <DroppableSelectedColumns
              columns={selectedColumnsInOrder}
              columnItems={columnItems}
              updateConfig={updateConfig}
              onRemoveColumn={handleRemoveColumnFromRight}
              activeId={activeId}
            />
          </div>
        </div>
        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
              {activeId && String(activeId).startsWith("col-") ? (
                <ColumnDragPreview activeId={String(activeId)} />
              ) : activeId && String(activeId).startsWith("divider-") ? (
                <DividerDragPreview
                  label={(() => {
                    const item = selectedItemsInOrder.find(
                      (i) =>
                        isDivider(i) && `divider-${i.id}` === String(activeId),
                    );
                    return (item && isDivider(item) ? item.label : "") ?? "";
                  })()}
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
