"use client";

import { useEffect, useState } from "react";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { NULL_UUID } from "@/constants";
import { AreaSetCodeLabels, AreaSetCodeYears } from "@/labels";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import {
  DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR,
  mapColorPalette,
} from "../../styles";
import { CHOROPLETH_AREA_SET_CODES } from "../Choropleth/configs";
import type { AreaSetCode } from "@/models/AreaSet";

// Outline-only boundaries drawn over the main ones, with their stroke colour
export default function SecondaryBoundariesControl({
  className,
}: {
  className?: string;
}) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const [secondaryBoundariesOpen, setSecondaryBoundariesOpen] = useState(
    Boolean(viewConfig.secondaryAreaSetCode),
  );

  useEffect(() => {
    if (viewConfig.secondaryAreaSetCode) {
      setSecondaryBoundariesOpen(true);
    }
  }, [viewConfig.secondaryAreaSetCode]);

  const secondaryBoundaryStrokeColor =
    viewConfig.secondaryBoundaryStrokeColor ||
    DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR;
  const secondaryBoundarySwatches = mapColorPalette.map((c) => c.color);

  return (
    <div className={className}>
      {!secondaryBoundariesOpen && !viewConfig.secondaryAreaSetCode ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
          onClick={() => setSecondaryBoundariesOpen(true)}
        >
          Add secondary boundaries
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-1 mt-2">
          <p className="text-xs text-muted-foreground font-mono font-medium uppercase">
            Secondary boundaries
          </p>
          <button
            type="button"
            className="text-xs text-muted-foreground underline cursor-pointer text-left hover:text-foreground transition-colors"
            onClick={() => {
              updateViewConfig({ secondaryAreaSetCode: null });
              setSecondaryBoundariesOpen(false);
            }}
          >
            Remove
          </button>
        </div>
      )}
      {(secondaryBoundariesOpen || viewConfig.secondaryAreaSetCode) && (
        <div className="flex items-center gap-2">
          <Select
            value={viewConfig.secondaryAreaSetCode || NULL_UUID}
            onValueChange={(value) => {
              const nextValue =
                value === NULL_UUID ? null : (value as AreaSetCode);
              updateViewConfig({ secondaryAreaSetCode: nextValue });
              if (!nextValue) {
                setSecondaryBoundariesOpen(false);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-full text-xs font-normal shadow-xs hover:border-action-hover"
            >
              <SelectValue placeholder="Secondary boundaries…">
                {viewConfig.secondaryAreaSetCode
                  ? AreaSetCodeLabels[viewConfig.secondaryAreaSetCode]
                  : "No secondary boundaries"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_UUID}>No secondary boundaries</SelectItem>
              {CHOROPLETH_AREA_SET_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  <div className="flex flex-col">
                    <span>{AreaSetCodeLabels[code]}</span>
                    <span
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: AreaSetCodeYears[code],
                      }}
                    />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-8 w-8 rounded-lg border border-input shadow-xs flex items-center justify-center",
                  "hover:border-action-hover transition-colors",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                )}
                aria-label="Secondary boundary stroke colour"
                title="Secondary boundary stroke colour"
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/15"
                  style={{ backgroundColor: secondaryBoundaryStrokeColor }}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <p className="text-xs font-medium mb-2">Stroke colour</p>
              <div className="flex flex-wrap gap-2">
                {secondaryBoundarySwatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-7 w-7 rounded-full border border-black/10",
                      "hover:scale-[1.02] transition-transform",
                      c === secondaryBoundaryStrokeColor &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() =>
                      updateViewConfig({ secondaryBoundaryStrokeColor: c })
                    }
                    aria-label={`Set stroke colour to ${c}`}
                  />
                ))}
                <label className="h-7 w-7 rounded-full border border-black/10 relative overflow-hidden cursor-pointer">
                  <input
                    type="color"
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    value={secondaryBoundaryStrokeColor}
                    onChange={(e) =>
                      updateViewConfig({
                        secondaryBoundaryStrokeColor: e.target.value,
                      })
                    }
                    aria-label="Custom stroke colour"
                  />
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundColor: secondaryBoundaryStrokeColor,
                    }}
                    aria-hidden
                  />
                </label>
              </div>
              {viewConfig.secondaryBoundaryStrokeColor && (
                <button
                  type="button"
                  className="mt-3 text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                  onClick={() =>
                    updateViewConfig({
                      secondaryBoundaryStrokeColor: null,
                    })
                  }
                >
                  Reset to default
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
