"use client";

import { GripVertical, Minus } from "lucide-react";

export function ColumnDragPreview({
  activeId,
  columnMetadata,
}: {
  activeId: string;
  columnMetadata: Record<string, { displayName?: string }>;
}) {
  const columnName = activeId.startsWith("col-")
    ? activeId.slice("col-".length)
    : "";
  const displayName = columnMetadata[columnName]?.displayName;

  return (
    <div className="flex flex-col gap-1.5 rounded border-2 border-primary/30 bg-white py-1.5 px-2 shadow-lg min-w-[140px]">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grabbing" />
        <span
          className="text-xs font-mono text-muted-foreground flex-1 truncate"
          title={columnName}
        >
          {columnName}
        </span>
      </div>
      <span className="text-sm font-medium truncate pl-5">
        {displayName || columnName || "—"}
      </span>
    </div>
  );
}

export function DividerDragPreview({
  activeId,
  label,
}: {
  activeId: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded border-2 border-dashed border-primary/30 bg-white py-1.5 px-2 shadow-lg min-w-[140px]">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grabbing" />
      <Minus className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 truncate">
        {label || "Section label"}
      </span>
    </div>
  );
}

export function AvailableDragPreview({ activeId }: { activeId: string }) {
  let columnName = "";
  if (activeId.startsWith("available-")) {
    columnName = activeId.includes("::")
      ? activeId.slice(activeId.indexOf("::") + 2)
      : activeId.slice("available-".length);
  } else if (activeId.startsWith("left-selected-")) {
    const match = activeId.match(/^left-selected-\d+-/);
    columnName = match ? activeId.slice(match[0].length) : "";
  }
  return (
    <div className="flex items-center gap-2 rounded border-2 border-primary/30 bg-white py-1.5 px-2 shadow-lg min-w-[140px]">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grabbing" />
      <span
        className="text-xs font-mono text-muted-foreground flex-1 truncate"
        title={columnName}
      >
        {columnName}
      </span>
    </div>
  );
}
