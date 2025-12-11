import { atom } from "jotai";
import { DEFAULT_ZOOM } from "@/constants";
import type { MapRef } from "react-map-gl/mapbox";

export const mapIdAtom = atom<string | null>(null);
export const mapRefAtom = atom<{ current: MapRef | null }>({ current: null });
export const viewIdAtom = atom<string | null>(null);
export const dirtyViewIdsAtom = atom<string[]>([]);
export const zoomAtom = atom<number>(DEFAULT_ZOOM);
export const pinDropModeAtom = atom<boolean>(false);
export const showControlsAtom = atom<boolean>(true);
export const compareAreasAtom = atom<boolean>(false);
