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
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import { Label } from "@/shadcn/ui/label";
import { inferFormat } from "./constants";
import { AvailableColumnsCheckboxList } from "./AvailableColumnsCheckboxList";
import { AvailableDragPreview, ColumnDragPreview } from "./DragPreviews";
import { DroppableSelectedColumns } from "./DroppableSelectedColumns";
import type { DragEndEvent } from "@dnd-kit/core";

export function ColumnsSection({
  config,
  allColumnsInOrder,
  selectedColumnsInOrder,
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      const activeStr = String(active.id);
      const overStr = over ? String(over.id) : null;

      if (activeStr.startsWith("col-") && overStr?.startsWith("col-")) {
        const oldIndex = columnIds.indexOf(activeStr);
        const newIndex = columnIds.indexOf(overStr);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = [...selectedColumnsInOrder];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        const newColumnOrder = [
          ...next,
          ...allColumnsInOrder.filter((c) => !next.includes(c)),
        ];
        updateConfig((prev) => ({
          ...prev,
          columns: next,
          columnOrder: newColumnOrder,
        }));
        return;
      }
      if (
        activeStr.startsWith("available-") &&
        overStr?.startsWith("available-")
      ) {
        const activeCol = activeStr.slice("available-".length);
        const overCol = overStr.slice("available-".length);
        const oldIdx = allColumnsInOrder.indexOf(activeCol);
        const newIdx = allColumnsInOrder.indexOf(overCol);
        if (oldIdx === -1 || newIdx === -1) return;
        const nextOrder = [...allColumnsInOrder];
        const [removed] = nextOrder.splice(oldIdx, 1);
        nextOrder.splice(newIdx, 0, removed);
        updateConfig((prev) => ({ ...prev, columnOrder: nextOrder }));
      }
    },
    [
      columnIds,
      updateConfig,
      allColumnsInOrder,
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
                return {
                  ...prev,
                  columns: nextColumns,
                  columnOrder: nextColumns,
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
              updateConfig((prev) => ({ ...prev, columns: [] }))
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
              All columns (selected at top, drag to reorder, tick to add)
            </p>
            <AvailableColumnsCheckboxList
              allColumnsInOrder={allColumnsInOrder}
              selectedColumns={columns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
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
              chartDataSource={
                config.chart?.enabled
                  ? (config.chart?.dataSource ?? null)
                  : null
              }
              chartColumnNames={config.chart?.columnNames}
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
