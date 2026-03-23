"use client";

import { X } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { getCategoryColorScale } from "@/utils/colors";

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
}: ColorMappingsEditorProps) {
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

  return (
    <div className="p-2 flex flex-col gap-1">
      {values.map((value) => {
        const explicit = colorMappings[value];
        const displayColor =
          explicit ?? fallbackColors?.[value] ?? defaultColor(value);
        return (
          <div key={value} className="flex items-center gap-2">
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
            {explicit && (
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
      })}
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
