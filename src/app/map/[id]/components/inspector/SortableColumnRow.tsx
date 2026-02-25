"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";

import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";

export function SortableColumnRow({
  id,
  columnName,
  displayName,
  onDisplayNameChange,
  onRemove,
  isDragging,
}: {
  id: string;
  columnName: string;
  displayName: string | undefined;
  onDisplayNameChange: (value: string) => void;
  onRemove?: () => void;
  isDragging?: boolean;
}) {
  const [localDisplayName, setLocalDisplayName] = useState(displayName ?? "");
  useEffect(() => setLocalDisplayName(displayName ?? ""), [displayName]);
  const debouncedChange = useDebouncedCallback(onDisplayNameChange, 300);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndDragging,
  } = useSortable({ id });

  const dragging = isDragging ?? dndDragging;
  // When dragging, hide source so only DragOverlay is visible; keep slot in place
  const style = dragging
    ? { transition }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded border border-transparent bg-neutral-50/80 py-1.5 px-2 group",
        dragging && "opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 -ml-0.5"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span
          className="text-xs font-mono text-muted-foreground flex-1 truncate"
          title={columnName}
        >
          {columnName}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-neutral-100"
            aria-label="Remove column"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <Input
        className="h-7 flex-1 min-w-0 text-sm"
        placeholder="Display name"
        value={localDisplayName}
        onChange={(e) => {
          const v = e.target.value;
          setLocalDisplayName(v);
          debouncedChange(v);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
