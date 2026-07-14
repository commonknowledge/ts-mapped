"use client";

import { useAtom } from "jotai";
import { yearFilterAtom } from "../atoms/markerAtoms";
import type { YearFilter } from "../atoms/markerAtoms";

export function useYearFilter(): {
  yearFilter: YearFilter;
  setYearFilter: (filter: YearFilter) => void;
  /** The active [min, max] range, or null when the filter is disabled. */
  activeYearRange: { min: number; max: number } | null;
} {
  const [yearFilter, setYearFilter] = useAtom(yearFilterAtom);
  const activeYearRange =
    yearFilter.enabled && yearFilter.min !== null && yearFilter.max !== null
      ? { min: yearFilter.min, max: yearFilter.max }
      : null;
  return { yearFilter, setYearFilter, activeYearRange };
}
