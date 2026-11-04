import { atom } from "jotai";

// Lists of areas hidden from the map, by id; shown unless hidden here
export const hiddenAreaListIdsAtom = atom<Record<string, boolean>>({});

// The list open in the inspector's place, if any
export const inspectedAreaListIdAtom = atom<string | null>(null);
