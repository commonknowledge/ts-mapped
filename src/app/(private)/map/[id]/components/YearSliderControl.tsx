"use client";

import { useMemo } from "react";
import { useMarkerQueries } from "@/app/(private)/map/[id]/hooks/useMarkerQueries";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Slider } from "@/shadcn/ui/slider";
import { cn } from "@/shadcn/utils";
import { useYearFilter } from "../hooks/useYearFilter";

/**
 * Single-year filter for markers. Only appears when at least one loaded
 * marker data source provides record years (a `yearColumn`/`dateColumn`
 * role on the data source). The checkbox enables the filter; the slider
 * knob picks the year. Sources without a year column are never filtered.
 */
export default function YearSliderControl() {
  const markerQueries = useMarkerQueries();
  const { yearFilter, setYearFilter } = useYearFilter();

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
  const year = clamp(yearFilter.year ?? domain.max);

  return (
    <div className="bg-white rounded shadow-md px-3 py-2 flex items-center gap-3 pointer-events-auto text-sm">
      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
        <Checkbox
          checked={yearFilter.enabled}
          onCheckedChange={(checked) =>
            setYearFilter({ enabled: checked === true, year })
          }
          aria-label="Filter markers by year"
        />
        Year
      </label>
      <Slider
        min={domain.min}
        max={domain.max}
        step={1}
        value={[year]}
        disabled={!yearFilter.enabled}
        // Live update while dragging so the map animates through the years
        onValueChange={(value) =>
          setYearFilter({ enabled: true, year: value[0] })
        }
        aria-label="Year"
        className={cn("w-44", !yearFilter.enabled && "opacity-60")}
      />
      <span
        className={cn(
          "text-xs font-medium tabular-nums w-8",
          !yearFilter.enabled && "text-muted-foreground",
        )}
      >
        {year}
      </span>
    </div>
  );
}
