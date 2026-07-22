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
import { ColorScheme } from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import {
  CHOROPLETH_COLOR_SCHEMES,
  getCategoryColorScale,
  getColorSchemePreset,
} from "@/utils/colors";
import type { DragEndEvent } from "@dnd-kit/core";

// Written out in full (not derived) so Tailwind generates both directions
const GRADIENT_CLASS = "bg-gradient-to-r";
const REVERSED_GRADIENT_CLASS = "bg-gradient-to-l";

export const VALUE_ORDER_HINT =
  "Drag to reorder. When markers overlap on the map, values at the top of this list are drawn on top of those below — put the most important values (e.g. Critical) first. The same order drives scaled marker sizes and the legend.";

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
  /**
   * If provided, enables the colour scheme preset selector, which pins a
   * scheme's colours down the current value order in one action.
   */
  onBulkChange?: (mappings: Record<string, string>) => void;
  /** Order-only mode: hides the per-row colour pickers and colour actions */
  hideColors?: boolean;
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
  onBulkChange,
  hideColors = false,
}: ColorMappingsEditorProps) {
  // Local order so rows follow the drag immediately; re-synced when the
  // saved order arrives back through props
  const [orderedValues, setOrderedValues] = useState<string[]>(values ?? []);
  useEffect(() => {
    setOrderedValues(values ?? []);
  }, [values]);

  // Direction for the scheme preset selector (matches the choropleth's
  // Reverse switch); the swatch previews flip with it, and toggling
  // re-applies the last-applied scheme so the change is visible immediately
  const [reversed, setReversed] = useState(false);
  const [appliedScheme, setAppliedScheme] = useState<ColorScheme | null>(null);

  if (values === undefined) {
    return <p className="text-sm text-muted-foreground p-3">Loading values…</p>;
  }
  if (values === null) {
    return (
      <p className="text-sm text-muted-foreground p-3">
        Too many unique values to configure{hideColors ? "" : " colours"}.
      </p>
    );
  }
  if (values.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-3">No values found.</p>
    );
  }

  const defaultColor = getCategoryColorScale(values);
  const hasMappings = !hideColors && Object.keys(colorMappings).length > 0;
  const sortable = Boolean(onReorder);
  const showPresets =
    !hideColors && Boolean(onBulkChange) && values.length >= 2;
  const showSourceColors = !hideColors && Boolean(onUseSourceColors);

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
        hasExplicitColor={!hideColors && Boolean(explicit)}
        sortable={sortable}
        hideColor={hideColors}
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
      {(showPresets || hasMappings || showSourceColors) && (
        <div className="mt-1 flex flex-col gap-1">
          {showPresets && (
            // Applying a scheme pins the sampled colours down the current
            // value order, so reordering afterwards does not change them
            <div className="flex items-center gap-2">
              <Select
                value=""
                onValueChange={(selected) => {
                  const scheme = selected as ColorScheme;
                  setAppliedScheme(scheme);
                  onBulkChange?.(
                    getColorSchemePreset({
                      scheme,
                      orderedValues,
                      reversed,
                    }),
                  );
                }}
              >
                <SelectTrigger size="sm" className="flex-1 min-w-0 text-xs">
                  <SelectValue placeholder="Apply a colour scheme…" />
                </SelectTrigger>
                <SelectContent>
                  {CHOROPLETH_COLOR_SCHEMES.filter(
                    (option) => option.value !== ColorScheme.Custom,
                  ).map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-4 h-4 rounded ${
                          reversed
                            ? option.color.replace(
                                GRADIENT_CLASS,
                                REVERSED_GRADIENT_CLASS,
                              )
                            : option.color
                        }`}
                      />
                      <span className="truncate">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label
                htmlFor="colour-scheme-preset-reverse"
                className="text-xs text-muted-foreground font-normal"
              >
                Reverse
              </Label>
              <Switch
                id="colour-scheme-preset-reverse"
                checked={reversed}
                onCheckedChange={(checked) => {
                  setReversed(checked);
                  if (appliedScheme) {
                    onBulkChange?.(
                      getColorSchemePreset({
                        scheme: appliedScheme,
                        orderedValues,
                        reversed: checked,
                      }),
                    );
                  }
                }}
              />
            </div>
          )}
          {hasMappings && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground w-full justify-start"
              onClick={onResetAll}
            >
              Reset all colours
            </Button>
          )}
          {showSourceColors && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground w-full justify-start"
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
        </div>
      )}
    </div>
  );
}

function ColorMappingRow({
  value,
  displayColor,
  hasExplicitColor,
  sortable,
  hideColor,
  onChange,
  onReset,
}: {
  value: string;
  displayColor: string;
  hasExplicitColor: boolean;
  sortable: boolean;
  hideColor: boolean;
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
      {!hideColor && (
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
      )}
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
