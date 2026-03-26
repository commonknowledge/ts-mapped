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
import type { InspectorColumnItem } from "@/models/MapView";
import type { InspectorDataSourceConfig } from "@/models/MapView";

type ColumnItem = Extract<InspectorColumnItem, { type: "column" }>;

export function DroppableSelectedColumns({
  columns,
  columnItems,
  updateConfig,
  onRemoveColumn,
  activeId,
}: {
  columns: string[];
  columnItems: ColumnItem[];
  updateConfig: (
    updater: (prev: InspectorDataSourceConfig) => InspectorDataSourceConfig,
  ) => void;
  onRemoveColumn?: (columnName: string) => void;
  activeId: string | null;
}) {
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
            {columns.map((col, i) => {
              const item = columnItems.find((ci) => ci.name === col);
              return (
                <SortableColumnRow
                  key={columnIds[i]}
                  id={columnIds[i]}
                  columnName={col}
                  format={item?.displayFormat}
                  onFormatChange={(format) =>
                    updateConfig((prev) => ({
                      ...prev,
                      inspectorColumnItems: (
                        prev.inspectorColumnItems ?? []
                      ).map((ci) =>
                        ci.type === "column" && ci.name === col
                          ? { ...ci, displayFormat: format }
                          : ci,
                      ),
                    }))
                  }
                  comparisonStat={item?.comparisonStat}
                  onComparisonStatChange={(comparisonStat) =>
                    updateConfig((prev) => ({
                      ...prev,
                      inspectorColumnItems: (
                        prev.inspectorColumnItems ?? []
                      ).map((ci) =>
                        ci.type === "column" && ci.name === col
                          ? { ...ci, comparisonStat }
                          : ci,
                      ),
                    }))
                  }
                  scaleMax={item?.scaleMax ?? 3}
                  onScaleMaxChange={(scaleMax) =>
                    updateConfig((prev) => ({
                      ...prev,
                      inspectorColumnItems: (
                        prev.inspectorColumnItems ?? []
                      ).map((ci) =>
                        ci.type === "column" && ci.name === col
                          ? { ...ci, scaleMax }
                          : ci,
                      ),
                    }))
                  }
                  barColor={item?.barColor}
                  onBarColorChange={(value) =>
                    updateConfig((prev) => ({
                      ...prev,
                      inspectorColumnItems: (
                        prev.inspectorColumnItems ?? []
                      ).map((ci) =>
                        ci.type === "column" && ci.name === col
                          ? { ...ci, barColor: value || undefined }
                          : ci,
                      ),
                    }))
                  }
                  onRemove={
                    onRemoveColumn
                      ? () => onRemoveColumn(col)
                      : () =>
                          updateConfig((prev) => ({
                            ...prev,
                            inspectorColumnItems: (
                              prev.inspectorColumnItems ?? []
                            ).filter(
                              (ci) =>
                                !(ci.type === "column" && ci.name === col),
                            ),
                          }))
                  }
                  isDragging={activeId === columnIds[i]}
                />
              );
            })}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
