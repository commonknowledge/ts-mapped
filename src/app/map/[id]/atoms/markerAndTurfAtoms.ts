import { atom } from "jotai";
import type { Turf } from "@/server/models/Turf";
import type { LayerType } from "@/types";
import type { Feature } from "geojson";

export const editingTurfAtom = atom<Turf | null>(null);
export const selectedPlacedMarkerIdAtom = atom<string | null>(null);
export const searchMarkerAtom = atom<Feature | null>(null);
export const markerVisibilityAtom = atom<Record<string, boolean>>({});
export const turfVisibilityAtom = atom<Record<string, boolean>>({});
export const dataSourceVisibilityAtom = atom<Record<string, boolean>>({});
export const hiddenLayersAtom = atom<LayerType[]>([]);
