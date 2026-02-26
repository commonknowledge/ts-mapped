"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";

export function SortableDividerRow({
  id,
  label,
  onLabelChange,
  onRemove,
  isDragging,
}: {
  id: string;
  label: string;
  onLabelChange: (value: string) => void;
  onRemove?: () => void;
  isDragging?: boolean;
}) {
  const [localLabel, setLocalLabel] = useState(label);
  useEffect(() => setLocalLabel(label), [label]);
  const debouncedChange = useDebouncedCallback(onLabelChange, 600);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndDragging,
  } = useSortable({ id });

  const dragging = isDragging ?? dndDragging;
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
        "flex items-center gap-2 rounded border border-dashed border-neutral-300 bg-neutral-200 py-1.5 px-2 group",
        dragging && "opacity-0 pointer-events-none",
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 -ml-0.5"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Input
        className="h-7 flex-1 min-w-0 text-xs font-medium text-muted-foreground placeholder:text-muted-foreground/70"
        placeholder="Label (e.g. Demographics)"
        value={localLabel}
        onChange={(e) => {
          const v = e.target.value;
          setLocalLabel(v);
          debouncedChange(v);
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-neutral-100"
          aria-label="Remove divider"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
