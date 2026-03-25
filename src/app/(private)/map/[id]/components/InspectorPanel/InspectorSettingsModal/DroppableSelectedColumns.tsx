"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { cn } from "@/shadcn/utils";
import { SortableColumnRow } from "../../SortableColumnRow";
import { SELECTED_DROPPABLE_ID } from "./constants";
import type {
  InspectorColumnMeta,
  InspectorDataSourceConfig,
} from "@/models/MapView";

export function DroppableSelectedColumns({
  columns,
  columnMetadata,
  updateConfig,
  onRemoveColumn,
  activeId,
}: {
  columns: string[];
  columnMetadata?: Record<string, InspectorColumnMeta> | null;
  updateConfig: (
    updater: (prev: InspectorDataSourceConfig) => InspectorDataSourceConfig,
  ) => void;
  onRemoveColumn?: (columnName: string) => void;
  activeId: string | null;
}) {
  const meta = columnMetadata ?? {};
  const { setNodeRef, isOver } = useDroppable({ id: SELECTED_DROPPABLE_ID });
  const columnIds = useMemo(
    () => columns.map((c, i) => `col-${i}-${c}`),
    [columns],
  );

  const isEmpty = columns.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border flex-1 min-h-0 overflow-y-auto p-2 transition-all duration-150 flex flex-col",
        isOver
          ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20"
          : "bg-neutral-100/80 border-neutral-200",
      )}
    >
      {isEmpty ? (
        <p className="text-xs py-6 text-center text-muted-foreground">
          No columns — tick Available to add
        </p>
      ) : (
        <SortableContext
          items={columnIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5 flex-1">
            {columns.map((col, i) => (
              <SortableColumnRow
                key={columnIds[i]}
                id={columnIds[i]}
                columnName={col}
                displayName={meta[col]?.displayName}
                onDisplayNameChange={(value) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        displayName: value || undefined,
                      },
                    },
                  }))
                }
                description={meta[col]?.description}
                onDescriptionChange={(value) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        description: value || undefined,
                      },
                    },
                  }))
                }
                format={meta[col]?.format ?? "text"}
                onFormatChange={(format) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        format,
                      },
                    },
                  }))
                }
                comparisonStat={meta[col]?.comparisonStat}
                onComparisonStatChange={(comparisonStat) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        comparisonStat,
                      },
                    },
                  }))
                }
                scaleMax={meta[col]?.scaleMax ?? 3}
                onScaleMaxChange={(scaleMax) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        scaleMax,
                      },
                    },
                  }))
                }
                barColor={meta[col]?.barColor}
                onBarColorChange={(value) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        barColor: value || undefined,
                      },
                    },
                  }))
                }
                onRemove={
                  onRemoveColumn
                    ? () => onRemoveColumn(col)
                    : () =>
                        updateConfig((prev) => {
                          const nextColumns = prev.columns.filter(
                            (c) => c !== col,
                          );
                          const nextMeta = Object.fromEntries(
                            Object.entries(prev.columnMetadata ?? {}).filter(
                              ([k]) => k !== col,
                            ),
                          );
                          return {
                            ...prev,
                            columns: nextColumns,
                            columnMetadata: nextMeta,
                            ...(prev.columnItems?.length && {
                              columnItems: prev.columnItems.filter(
                                (item) => item !== col,
                              ),
                            }),
                          };
                        })
                }
                isDragging={activeId === columnIds[i]}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
