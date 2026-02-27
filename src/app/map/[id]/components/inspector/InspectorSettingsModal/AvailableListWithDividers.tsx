"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/shadcn/utils";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { InspectorColumnItem } from "@/server/models/MapView";
import { AvailableColumnRow } from "./AvailableColumnRow";
import { SELECTED_LEFT_DROPPABLE_ID } from "./constants";
import { SortableAvailableRow } from "./SortableAvailableRow";
import { SortableDividerRow } from "./SortableDividerRow";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return typeof item === "object" && item !== null && item.type === "divider";
}

export function AvailableListWithDividers({
  selectedItemsInOrder,
  selectedSectionIds,
  availableColumns,
  onAddColumn,
  onRemoveColumn,
  onAddDivider,
  onDividerLabelChange,
  onRemoveDivider,
  activeId,
  mode = "both",
}: {
  selectedItemsInOrder: InspectorColumnItem[];
  selectedSectionIds: string[];
  availableColumns: string[];
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnName: string) => void;
  onAddDivider: () => void;
  onDividerLabelChange: (id: string, label: string) => void;
  onRemoveDivider: (id: string) => void;
  activeId: string | null;
  /** Which parts of the panel to show: both (default), only selected list, or only available list */
  mode?: "both" | "selected" | "available";
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: SELECTED_LEFT_DROPPABLE_ID,
  });

  return (
    <div className="rounded border border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Selected (top): sortable list so you can always see and reorder selected columns + dividers */}
      {mode !== "available" && (
        <>
          <div className="p-2 shrink-0">
            <button
              type="button"
              onClick={onAddDivider}
              className="w-full rounded border border-dashed border-neutral-300 py-1.5 text-xs text-muted-foreground hover:border-neutral-400 hover:text-foreground transition-colors"
            >
              + Add label divider
            </button>
          </div>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <p className="text-[11px] font-medium text-muted-foreground px-2 pb-1 shrink-0">
              Selected
            </p>
            <div
              ref={setNodeRef}
              className={cn(
                "flex-1 min-h-0 overflow-y-auto p-2 pt-0 rounded-b space-y-1",
                isOver &&
                  "bg-primary/5 ring-1 ring-primary/20 border border-primary/30 border-dashed",
              )}
            >
              <SortableContext
                items={selectedSectionIds}
                strategy={verticalListSortingStrategy}
              >
                {selectedItemsInOrder.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    Tick columns below to add
                  </p>
                ) : (
                  selectedItemsInOrder.map((item, i) =>
                    typeof item === "string" ? (
                      <SortableAvailableRow
                        key={selectedSectionIds[i]}
                        id={selectedSectionIds[i]}
                        columnName={item}
                        selected={true}
                        onToggle={() => onRemoveColumn(item)}
                        isDragging={activeId === selectedSectionIds[i]}
                      />
                    ) : (
                      <SortableDividerRow
                        key={`divider-${item.id}`}
                        id={selectedSectionIds[i]}
                        label={item.label}
                        onLabelChange={(value) =>
                          onDividerLabelChange(item.id, value)
                        }
                        onRemove={() => onRemoveDivider(item.id)}
                        isDragging={activeId === selectedSectionIds[i]}
                      />
                    ),
                  )
                )}
              </SortableContext>
            </div>
          </div>
        </>
      )}

      {/* Available (bottom): simple list, no sorting */}
      {mode !== "selected" && (
        <div className="flex-1 overflow-y-auto  flex flex-col min-h-0">
          <div className="p-2 pt-0 space-y-1 overflow-y-auto">
            {availableColumns.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                All columns selected
              </p>
            ) : (
              availableColumns.map((col) => (
                <AvailableColumnRow
                  key={col}
                  columnName={col}
                  onAdd={() => onAddColumn(col)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
