import { atom } from "jotai";
import type { DateFilterKey } from "../dateFilters";
import type { PublicFiltersFormValue } from "@/types";

export const publicFiltersAtom = atom<Record<string, PublicFiltersFormValue[]>>(
  {},
);

// Active date quick-filter per data source (only used when sorted by date).
export const publicDateFilterAtom = atom<
  Record<string, DateFilterKey | undefined>
>({});
