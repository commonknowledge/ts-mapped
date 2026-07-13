"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { getCategoryColorScale } from "@/utils/colors";
import type { DragEndEvent } from "@dnd-kit/core";

interface ColorMappingsEditorProps {
  /** Sorted distinct values to display. `undefined` = still loading, `null` = too many values. */
  values: string[] | null | undefined;
  /** Explicitly-set colour mappings (value → hex). These determine whether reset buttons appear. */
  colorMappings: Record<string, string>;
  /**
   * Fallback display colours for values not in `colorMappings` (shown before D3 defaults).
   * Use this to surface canonical data-source colours when the current layer has no override.
   */
  fallbackColors?: Record<string, string>;
  onChange: (value: string, color: string) => void;
  onReset: (value: string) => void;
  onResetAll: () => void;
  /** If provided, shows a "Save as data source defaults" button when there are map-level overrides. */
  onSaveAsDefaults?: () => void;
  /** If provided, shows a "Use source colours" button for non-owners to copy the owner's colours. */
  onUseSourceColors?: () => void;
  /** If provided, rows are drag-reorderable and the new order is reported on drop. */
  onReorder?: (orderedValues: string[]) => void;
  /** Shown above the rows when reordering is enabled, explaining why order matters. */
  reorderHint?: string;
}

export default function ColorMappingsEditor({
  values,
  colorMappings,
  fallbackColors,
  onChange,
  onReset,
  onResetAll,
  onSaveAsDefaults,
  onUseSourceColors,
  onReorder,
  reorderHint,
}: ColorMappingsEditorProps) {
  // Local order so rows follow the drag immediately; re-synced when the
  // saved order arrives back through props
  const [orderedValues, setOrderedValues] = useState<string[]>(values ?? []);
  useEffect(() => {
    setOrderedValues(values ?? []);
  }, [values]);

  if (values === undefined) {
    return <p className="text-sm text-muted-foreground p-3">Loading values…</p>;
  }
  if (values === null) {
    return (
      <p className="text-sm text-muted-foreground p-3">
        Too many unique values to configure colours.
      </p>
    );
  }
  if (values.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-3">No values found.</p>
    );
  }

  const defaultColor = getCategoryColorScale(values);
  const hasMappings = Object.keys(colorMappings).length > 0;
  const sortable = Boolean(onReorder);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = orderedValues.indexOf(String(active.id));
    const newIndex = orderedValues.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const next = arrayMove(orderedValues, oldIndex, newIndex);
    setOrderedValues(next);
    onReorder?.(next);
  };

  const rows = orderedValues.map((value) => {
    const explicit = colorMappings[value];
    const displayColor =
      explicit ?? fallbackColors?.[value] ?? defaultColor(value);
    return (
      <ColorMappingRow
        key={value}
        value={value}
        displayColor={displayColor}
        hasExplicitColor={Boolean(explicit)}
        sortable={sortable}
        onChange={onChange}
        onReset={onReset}
      />
    );
  });

  return (
    <div className="p-2 flex flex-col gap-1">
      {sortable && reorderHint && (
        <p className="text-xs text-muted-foreground pb-1">{reorderHint}</p>
      )}
      {sortable ? (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedValues}
            strategy={verticalListSortingStrategy}
          >
            {rows}
          </SortableContext>
        </DndContext>
      ) : (
        rows
      )}
      {(hasMappings || onUseSourceColors) && (
        <>
          {hasMappings && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 text-xs text-muted-foreground w-full justify-start"
              onClick={onResetAll}
            >
              Reset all colours
            </Button>
          )}
          {onUseSourceColors && (
            <Button
              variant="ghost"
              size="sm"
              className={
                hasMappings
                  ? "text-xs text-muted-foreground w-full justify-start"
                  : "mt-1 text-xs text-muted-foreground w-full justify-start"
              }
              onClick={onUseSourceColors}
            >
              Use source colours
            </Button>
          )}
          {onSaveAsDefaults && hasMappings && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground w-full justify-start"
              onClick={onSaveAsDefaults}
            >
              Save as data source defaults
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function ColorMappingRow({
  value,
  displayColor,
  hasExplicitColor,
  sortable,
  onChange,
  onReset,
}: {
  value: string;
  displayColor: string;
  hasExplicitColor: boolean;
  sortable: boolean;
  onChange: (value: string, color: string) => void;
  onReset: (value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: value, disabled: !sortable });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 bg-white"
    >
      {sortable && (
        <button
          type="button"
          aria-label={`Reorder ${value || "(blank)"}`}
          className="cursor-grab text-neutral-400 hover:text-neutral-600 shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <label className="relative cursor-pointer shrink-0">
        <div
          className="w-7 h-7 rounded border border-neutral-300"
          style={{ backgroundColor: displayColor }}
        />
        <Input
          type="color"
          value={displayColor}
          onChange={(e) => onChange(value, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0"
        />
      </label>
      <span className="font-mono text-xs text-muted-foreground truncate flex-1">
        {value || "(blank)"}
      </span>
      {hasExplicitColor && (
        <button
          type="button"
          onClick={() => onReset(value)}
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-100 shrink-0"
          title="Reset to default colour"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
