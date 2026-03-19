import { atom } from "jotai";
import type { PublicFiltersFormValue } from "@/types";

export const publicFiltersAtom = atom<Record<string, PublicFiltersFormValue[]>>(
  {},
);
