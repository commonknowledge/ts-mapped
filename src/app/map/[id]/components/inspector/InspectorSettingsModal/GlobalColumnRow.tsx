"use client";

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
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import {
  DEFAULT_BAR_COLOR_VALUE,
  INSPECTOR_BAR_COLOR_OPTIONS,
  SMART_MATCH_BAR_COLOR_VALUE,
  getSmartMatchInfo,
} from "../inspectorPanelOptions";
import type {
  InspectorColumnFormat,
  InspectorComparisonStat,
} from "@/server/models/MapView";

const FORMAT_OPTIONS: { value: InspectorColumnFormat; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "numberWithComparison", label: "Number with comparison" },
  { value: "percentage", label: "Percentage (bar)" },
  { value: "scale", label: "Scale (bars)" },
];

const COMPARISON_STAT_OPTIONS: {
  value: InspectorComparisonStat;
  label: string;
}[] = [
  { value: "average", label: "Average" },
  { value: "median", label: "Median" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

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
          if (v === DEFAULT_BAR_COLOR_VALUE)
            onBarColorChange(DEFAULT_BAR_COLOR_VALUE);
          else if (v === SMART_MATCH_BAR_COLOR_VALUE)
            onBarColorChange(SMART_MATCH_BAR_COLOR_VALUE);
          else onBarColorChange(v);
        }}
      >
        <SelectTrigger className="h-7 text-xs" onClick={onClick}>
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
            const label = isSmart
              ? `Smart match (${smartMatch.matchLabel})`
              : opt.label;
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

export function GlobalColumnRow({
  columnName,
  displayName,
  onDisplayNameChange,
  description,
  onDescriptionChange,
  format = "text",
  onFormatChange,
  comparisonStat,
  onComparisonStatChange,
  scaleMax = 3,
  onScaleMaxChange,
  barColor,
  onBarColorChange,
  isExpanded: initialExpanded = false,
  showInInspector = true,
  onShowInInspectorChange,
}: {
  columnName: string;
  displayName: string | undefined;
  onDisplayNameChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  format?: InspectorColumnFormat;
  onFormatChange?: (format: InspectorColumnFormat) => void;
  comparisonStat?: InspectorComparisonStat;
  onComparisonStatChange?: (value: InspectorComparisonStat) => void;
  scaleMax?: number;
  onScaleMaxChange?: (value: number) => void;
  barColor?: string;
  onBarColorChange?: (value: string) => void;
  isExpanded?: boolean;
  showInInspector?: boolean;
  onShowInInspectorChange?: (show: boolean) => void;
}) {
  const [localDisplayName, setLocalDisplayName] = useState(displayName ?? "");
  const [localDescription, setLocalDescription] = useState(description ?? "");
  const [localScaleMax, setLocalScaleMax] = useState(String(scaleMax));
  const [expanded, setExpanded] = useState(initialExpanded);

  useEffect(() => setLocalDisplayName(displayName ?? ""), [displayName]);
  useEffect(() => setLocalDescription(description ?? ""), [description]);
  useEffect(() => setLocalScaleMax(String(scaleMax)), [scaleMax]);

  const debouncedDisplayName = useDebouncedCallback(onDisplayNameChange, 600);
  const debouncedDescription = useDebouncedCallback(
    (v: string) => onDescriptionChange?.(v),
    600,
  );
  const debouncedScaleMax = useDebouncedCallback(
    (v: number) => onScaleMaxChange?.(v),
    600,
  );

  const hasCustomSettings =
    (displayName ?? "") !== "" ||
    (description ?? "") !== "" ||
    format !== "text" ||
    (format === "scale" && scaleMax !== 3) ||
    (format === "numberWithComparison" && comparisonStat !== undefined) ||
    ((format === "percentage" || format === "scale") && (barColor ?? "") !== "");

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors"
      >
        {onShowInInspectorChange != null && (
          <div
            className="shrink-0 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={showInInspector}
              onCheckedChange={(checked) =>
                onShowInInspectorChange(checked === true)
              }
              onClick={(e) => e.stopPropagation()}
              aria-label={`Show ${columnName} in inspector`}
            />
          </div>
        )}
        <span
          className={cn(
            "text-xs font-mono font-medium truncate flex-1",
            hasCustomSettings ? "text-foreground" : "text-muted-foreground",
          )}
          title={columnName}
        >
          {columnName}
        </span>
        {hasCustomSettings && (
          <span className="text-[10px] uppercase text-primary font-medium shrink-0">
            Custom
          </span>
        )}
        <span
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-neutral-100">
          <div className="space-y-1 pt-3">
            <Label className="text-[10px] text-muted-foreground uppercase">
              Display name
            </Label>
            <Input
              className="h-8 text-sm"
              placeholder={columnName}
              value={localDisplayName}
              onChange={(e) => {
                const v = e.target.value;
                setLocalDisplayName(v);
                debouncedDisplayName(v);
              }}
            />
          </div>
          {onDescriptionChange && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">
                Description (tooltip)
              </Label>
              <Input
                className="h-8 text-sm"
                placeholder="Shown on hover in inspector"
                value={localDescription}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalDescription(v);
                  debouncedDescription(v);
                }}
              />
            </div>
          )}
          {onFormatChange && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">
                Format
              </Label>
              <Select
                value={format}
                onValueChange={(v) => onFormatChange(v as InspectorColumnFormat)}
              >
                <SelectTrigger className="h-8 text-xs">
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
                className="h-8 text-sm"
                value={localScaleMax}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalScaleMax(v);
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n) && n >= 2 && n <= 10)
                    debouncedScaleMax(n);
                }}
              />
            </div>
          )}
          {format === "numberWithComparison" && onComparisonStatChange && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">
                Compare to
              </Label>
              <Select
                value={comparisonStat ?? "average"}
                onValueChange={(v) =>
                  onComparisonStatChange(v as InspectorComparisonStat)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPARISON_STAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(format === "percentage" || format === "scale") &&
            onBarColorChange && (
              <BarColorSelect
                barColor={barColor}
                onBarColorChange={onBarColorChange}
                displayName={displayName}
                columnName={columnName}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            )}
        </div>
      )}
    </div>
  );
}
