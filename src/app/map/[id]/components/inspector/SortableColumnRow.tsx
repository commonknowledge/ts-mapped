"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";

import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import {
  DEFAULT_BAR_COLOR_VALUE,
  INSPECTOR_BAR_COLOR_OPTIONS,
  SMART_MATCH_BAR_COLOR_VALUE,
  getSmartMatchInfo,
} from "./inspectorPanelOptions";

import type { InspectorColumnFormat } from "@/server/models/MapView";

const FORMAT_OPTIONS: { value: InspectorColumnFormat; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage (bar)" },
  { value: "scale", label: "Scale (bars)" },
];

/** Resolve select value: empty/undefined treated as Smart match for backward compat. */
function barColorSelectValue(barColor: string | undefined): string {
  if (barColor === DEFAULT_BAR_COLOR_VALUE) return DEFAULT_BAR_COLOR_VALUE;
  if (!barColor || barColor === "" || barColor === SMART_MATCH_BAR_COLOR_VALUE)
    return SMART_MATCH_BAR_COLOR_VALUE;
  return barColor;
}

function BarColorSelect({
  barColor,
  onBarColorChange,
  displayName,
  columnName,
  onClick,
}: {
  barColor?: string;
  onBarColorChange: (value: string) => void;
  displayName: string | undefined;
  columnName: string;
  onClick: (e: MouseEvent) => void;
}) {
  const value = barColorSelectValue(barColor);
  const smartMatch = getSmartMatchInfo(displayName ?? columnName, columnName);

  const triggerLabel =
    value === DEFAULT_BAR_COLOR_VALUE
      ? "Default"
      : value === SMART_MATCH_BAR_COLOR_VALUE
        ? `Smart match (${smartMatch.matchLabel})`
        : null;

  const triggerSwatchColor =
    value === DEFAULT_BAR_COLOR_VALUE
      ? "hsl(var(--primary))"
      : value === SMART_MATCH_BAR_COLOR_VALUE
        ? smartMatch.color
        : null;

  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase">
        Bar colour
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === DEFAULT_BAR_COLOR_VALUE) onBarColorChange(DEFAULT_BAR_COLOR_VALUE);
          else if (v === SMART_MATCH_BAR_COLOR_VALUE) onBarColorChange(SMART_MATCH_BAR_COLOR_VALUE);
          else onBarColorChange(v);
        }}
      >
        <SelectTrigger
          className="h-7 text-xs"
          onClick={onClick}
        >
          {triggerLabel !== null ? (
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full border border-neutral-200",
                  value === DEFAULT_BAR_COLOR_VALUE && "bg-primary",
                )}
                style={
                  value !== DEFAULT_BAR_COLOR_VALUE && triggerSwatchColor
                    ? { backgroundColor: triggerSwatchColor }
                    : undefined
                }
              />
              {triggerLabel}
            </span>
          ) : (
            <SelectValue placeholder="Default" />
          )}
        </SelectTrigger>
        <SelectContent>
          {INSPECTOR_BAR_COLOR_OPTIONS.map((opt) => {
            const isDefault = opt.value === DEFAULT_BAR_COLOR_VALUE;
            const isSmart = opt.value === SMART_MATCH_BAR_COLOR_VALUE;
            const swatchColor = isSmart ? smartMatch.color : opt.hex;
            const label = isSmart ? `Smart match (${smartMatch.matchLabel})` : opt.label;
            return (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full border border-neutral-200",
                      isDefault && "bg-primary",
                    )}
                    style={
                      isDefault ? undefined : { backgroundColor: swatchColor }
                    }
                  />
                  {label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SortableColumnRow({
  id,
  columnName,
  displayName,
  onDisplayNameChange,
  format = "text",
  onFormatChange,
  scaleMax = 3,
  onScaleMaxChange,
  includeInChart,
  onIncludeInChartChange,
  showChartCheckbox,
  barColor,
  onBarColorChange,
  onRemove,
  isDragging,
}: {
  id: string;
  columnName: string;
  displayName: string | undefined;
  onDisplayNameChange: (value: string) => void;
  format?: InspectorColumnFormat;
  onFormatChange?: (format: InspectorColumnFormat) => void;
  scaleMax?: number;
  onScaleMaxChange?: (value: number) => void;
  includeInChart?: boolean;
  onIncludeInChartChange?: (include: boolean) => void;
  showChartCheckbox?: boolean;
  barColor?: string;
  onBarColorChange?: (value: string) => void;
  onRemove?: () => void;
  isDragging?: boolean;
}) {
  const [localDisplayName, setLocalDisplayName] = useState(displayName ?? "");
  useEffect(() => setLocalDisplayName(displayName ?? ""), [displayName]);
  const debouncedChange = useDebouncedCallback(onDisplayNameChange, 600);

  const [localScaleMax, setLocalScaleMax] = useState(String(scaleMax));
  useEffect(() => setLocalScaleMax(String(scaleMax)), [scaleMax]);
  const debouncedScaleMax = useDebouncedCallback(
    (v: number) => onScaleMaxChange?.(v),
    600,
  );

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
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground uppercase">
          Display name
        </Label>
        <Input
          className="h-7 flex-1 min-w-0 text-sm"
          placeholder={columnName}
          value={localDisplayName}
          onChange={(e) => {
            const v = e.target.value;
            setLocalDisplayName(v);
            debouncedChange(v);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {onFormatChange && (
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase">
            Format
          </Label>
          <Select
            value={format}
            onValueChange={(v) => onFormatChange(v as InspectorColumnFormat)}
          >
            <SelectTrigger
              className="h-7 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {format === "scale" && onScaleMaxChange && (
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase">
            Scale (max value)
          </Label>
          <Input
            type="number"
            min={2}
            max={10}
            className="h-7 text-sm"
            value={localScaleMax}
            onChange={(e) => {
              const v = e.target.value;
              setLocalScaleMax(v);
              const n = parseInt(v, 10);
              if (!Number.isNaN(n) && n >= 2 && n <= 10) debouncedScaleMax(n);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {(format === "percentage" || format === "scale") && onBarColorChange && (
        <BarColorSelect
          barColor={barColor}
          onBarColorChange={onBarColorChange}
          displayName={displayName}
          columnName={columnName}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        />
      )}
      {showChartCheckbox && onIncludeInChartChange && (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={`${id}-chart`}
            checked={includeInChart ?? false}
            onCheckedChange={(checked) =>
              onIncludeInChartChange(checked === true)
            }
            onClick={(e) => e.stopPropagation()}
          />
          <Label
            htmlFor={`${id}-chart`}
            className="text-[10px] text-muted-foreground cursor-pointer"
          >
            Include in chart
          </Label>
        </div>
      )}
    </div>
  );
}
