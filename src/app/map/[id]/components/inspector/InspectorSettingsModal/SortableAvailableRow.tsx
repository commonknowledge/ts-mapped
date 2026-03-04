"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { cn } from "@/shadcn/utils";

export function SortableAvailableRow({
  id,
  columnName,
  selected,
  onToggle,
  isDragging,
}: {
  id: string;
  columnName: string;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  isDragging?: boolean;
}) {
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
        "flex items-center gap-2 rounded py-1.5 px-2 text-sm hover:bg-neutral-100/80",
        dragging && "opacity-0 pointer-events-none",
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 -ml-0.5 shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={
          selected
            ? `Remove ${columnName} from columns to show`
            : `Add ${columnName} to columns to show`
        }
      />
      <span className="truncate font-mono text-xs flex-1">{columnName}</span>
    </div>
  );
}
