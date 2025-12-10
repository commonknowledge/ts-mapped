import { atom } from "jotai";
import type { Feature } from "geojson";

export const selectedPlacedMarkerIdAtom = atom<string | null>(null);
export const searchMarkerAtom = atom<Feature | null>(null);
export const markerVisibilityAtom = atom<Record<string, boolean>>({});
export const dataSourceVisibilityAtom = atom<Record<string, boolean>>({});
