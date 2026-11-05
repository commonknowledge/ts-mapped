import { atom } from "jotai";

// Lists of areas hidden from the map, by id; shown unless hidden here
export const hiddenAreaListIdsAtom = atom<Record<string, boolean>>({});

// The list open in the inspector's place, if any
export const inspectedAreaListIdAtom = atom<string | null>(null);

// The list being added to by clicking areas on the map, if any
export const quickAddAreaListIdAtom = atom<string | null>(null);
