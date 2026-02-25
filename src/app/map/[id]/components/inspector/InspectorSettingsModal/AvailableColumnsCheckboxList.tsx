"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableAvailableRow } from "./SortableAvailableRow";

export function AvailableColumnsCheckboxList({
  allColumnsInOrder,
  selectedColumns,
  onAddColumn,
  onRemoveColumn,
  availableIds,
  activeId,
}: {
  allColumnsInOrder: string[];
  selectedColumns: string[];
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnName: string) => void;
  availableIds: string[];
  activeId: string | null;
}) {
  return (
    <div className="rounded border border-dashed border-neutral-200 bg-neutral-50/50 p-2 min-h-[360px] max-h-[520px] overflow-y-auto space-y-1">
      <SortableContext
        items={availableIds}
        strategy={verticalListSortingStrategy}
      >
        {allColumnsInOrder.map((col) => (
          <SortableAvailableRow
            key={col}
            id={`available-${col}`}
            columnName={col}
            selected={selectedColumns.includes(col)}
            onToggle={(checked) =>
              checked ? onAddColumn(col) : onRemoveColumn(col)
            }
            isDragging={activeId === `available-${col}`}
          />
        ))}
      </SortableContext>
      {allColumnsInOrder.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          No columns in this data source
        </p>
      )}
    </div>
  );
}
