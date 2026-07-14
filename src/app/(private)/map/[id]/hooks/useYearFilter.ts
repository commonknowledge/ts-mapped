"use client";

import { useAtom } from "jotai";
import { yearFilterAtom } from "../atoms/markerAtoms";
import type { YearFilter } from "../atoms/markerAtoms";

export function useYearFilter(): {
  yearFilter: YearFilter;
  setYearFilter: (filter: YearFilter) => void;
  /** The year to filter markers to, or null when the filter is disabled. */
  activeYear: number | null;
} {
  const [yearFilter, setYearFilter] = useAtom(yearFilterAtom);
  const activeYear =
    yearFilter.enabled && yearFilter.year !== null ? yearFilter.year : null;
  return { yearFilter, setYearFilter, activeYear };
}
