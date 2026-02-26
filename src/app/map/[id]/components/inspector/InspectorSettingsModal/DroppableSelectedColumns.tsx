"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import { cn } from "@/shadcn/utils";
import { SortableColumnRow } from "../SortableColumnRow";
import { SELECTED_DROPPABLE_ID } from "./constants";

export function DroppableSelectedColumns({
  columns,
  columnMetadata,
  updateConfig,
  onRemoveColumn,
  activeId,
}: {
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
  onRemoveColumn?: (columnName: string) => void;
  activeId: string | null;
}) {
  const meta = columnMetadata ?? {};
  const { setNodeRef, isOver } = useDroppable({ id: SELECTED_DROPPABLE_ID });
  const columnIds = useMemo(
    () => columns.map((c) => `col-${c}`),
    [columns],
  );

  const isEmpty = columns.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border min-h-[360px] max-h-[520px] overflow-y-auto p-2 transition-all duration-150 flex flex-col",
        isOver
          ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20"
          : "border-neutral-200 bg-white",
      )}
    >
      {isEmpty ? (
        <p className="text-xs py-6 text-center text-muted-foreground">
          No columns — tick Available to add
        </p>
      ) : (
        <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5 flex-1">
            {columns.map((col) => (
                <SortableColumnRow
                  key={`col-${col}`}
                  id={`col-${col}`}
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
                            const base: Partial<InspectorBoundaryConfig> = {
                              columns: nextColumns,
                              columnMetadata: nextMeta,
                            };
                            if (prev.columnItems?.length) {
                              base.columnItems = prev.columnItems.filter(
                                (i) => i !== col,
                              );
                            }
                            return { ...prev, ...base };
                          })
                  }
                  isDragging={activeId === `col-${col}`}
                />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
