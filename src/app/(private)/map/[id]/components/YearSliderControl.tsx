"use client";

import { useMemo, useState } from "react";
import { useMarkerQueries } from "@/app/(private)/map/[id]/hooks/useMarkerQueries";
import { Button } from "@/shadcn/ui/button";
import { Slider } from "@/shadcn/ui/slider";
import { cn } from "@/shadcn/utils";
import { useYearFilter } from "../hooks/useYearFilter";

/**
 * Year range filter for markers. Only appears when at least one loaded
 * marker data source provides record years (a `yearColumn` role on the data
 * source). One shared slider filters every source that has a year column;
 * sources without one are never filtered.
 */
export default function YearSliderControl() {
  const markerQueries = useMarkerQueries();
  const { yearFilter, setYearFilter } = useYearFilter();

  // Range while dragging, before the filter is committed on release
  const [draggedRange, setDraggedRange] = useState<[number, number] | null>(
    null,
  );

  // Union of years across all loaded marker sources with a year column
  const domain = useMemo(() => {
    let min: number | null = null;
    let max: number | null = null;
    for (const dataSourceMarkers of markerQueries?.data ?? []) {
      for (const feature of dataSourceMarkers.markers) {
        const year = feature.properties.year;
        if (typeof year !== "number") {
          continue;
        }
        if (min === null || year < min) {
          min = year;
        }
        if (max === null || year > max) {
          max = year;
        }
      }
    }
    return min !== null && max !== null && min < max ? { min, max } : null;
  }, [markerQueries]);

  if (!domain) {
    return null;
  }

  const clamp = (year: number) =>
    Math.min(domain.max, Math.max(domain.min, year));
  const range: [number, number] = draggedRange ?? [
    clamp(yearFilter.min ?? domain.min),
    clamp(yearFilter.max ?? domain.max),
  ];

  return (
    <div className="bg-white rounded shadow-md px-3 py-2 flex items-center gap-3 pointer-events-auto text-sm">
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {range[0]}
      </span>
      <Slider
        min={domain.min}
        max={domain.max}
        step={1}
        value={range}
        onValueChange={(value) => setDraggedRange([value[0], value[1]])}
        // Committing on release avoids re-clustering jank while dragging
        onValueCommit={(value) => {
          setDraggedRange(null);
          setYearFilter({ enabled: true, min: value[0], max: value[1] });
        }}
        aria-label="Year range"
        className={cn("w-40", !yearFilter.enabled && "opacity-60")}
      />
      <span className="text-xs font-medium tabular-nums w-8">{range[1]}</span>
      <Button
        size="sm"
        variant={yearFilter.enabled ? "secondary" : "ghost"}
        className="h-7 text-xs"
        disabled={!yearFilter.enabled}
        onClick={() => setYearFilter({ enabled: false, min: null, max: null })}
      >
        All years
      </Button>
    </div>
  );
}
