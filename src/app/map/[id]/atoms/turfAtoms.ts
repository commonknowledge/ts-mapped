import { atom } from "jotai";
import type { Turf } from "@/server/models/Turf";

export const editingTurfAtom = atom<Turf | null>(null);
export const turfVisibilityAtom = atom<Record<string, boolean>>({});
